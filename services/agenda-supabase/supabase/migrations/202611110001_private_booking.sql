begin;
create schema if not exists booking_private;
revoke all on schema booking_private from public, anon, authenticated;

create table booking_private.attempts (
  key uuid primary key,
  fingerprint text not null,
  slot text not null,
  status text not null check (status in ('pending','unknown','confirmed','conflict')),
  response jsonb,
  created_at timestamptz not null default now()
);
create unique index booking_one_active_slot on booking_private.attempts(slot)
  where status in ('pending','unknown','confirmed');
create table booking_private.limits (
  bucket text primary key,
  hits integer not null,
  minute bigint not null
);
alter table booking_private.attempts enable row level security;
alter table booking_private.limits enable row level security;
revoke all on all tables in schema booking_private from public, anon, authenticated;

create function public.agenda_limit(p_bucket text, p_max integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer; m bigint := floor(extract(epoch from clock_timestamp()) / 60);
begin
  if length(p_bucket)>150 or p_max not between 1 and 200 then raise exception 'Invalid limit'; end if;
  delete from booking_private.limits where minute < m - 2;
  insert into booking_private.limits(bucket,hits,minute) values (p_bucket || ':' || m,1,m)
    on conflict(bucket) do update set hits=booking_private.limits.hits+1
    returning hits into n;
  return n <= p_max;
end; $$;

create function public.agenda_attempt(p_key uuid, p_fingerprint text, p_slot text, p_claim boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare prior booking_private.attempts%rowtype;
begin
  -- Single short transaction lock serializes claims across Edge Function isolates.
  perform pg_catalog.pg_advisory_xact_lock(7701112026);
  select * into prior from booking_private.attempts where key=p_key;
  if found then
    if prior.fingerprint<>p_fingerprint then return jsonb_build_object('state','mismatch'); end if;
    if prior.status='confirmed' then return jsonb_build_object('state','confirmed','response',prior.response); end if;
    return jsonb_build_object('state','unknown');
  end if;
  if not p_claim then return jsonb_build_object('state','new'); end if;
  if exists(select 1 from booking_private.attempts where slot=p_slot and status in ('pending','unknown','confirmed')) then
    return jsonb_build_object('state','unknown');
  end if;
  insert into booking_private.attempts(key,fingerprint,slot,status) values(p_key,p_fingerprint,p_slot,'pending');
  return jsonb_build_object('state','claimed');
end; $$;

create function public.agenda_finish(p_key uuid, p_state text, p_response jsonb default null)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if p_state not in ('confirmed','unknown','conflict') then raise exception 'Invalid state'; end if;
  update booking_private.attempts set status=p_state,response=p_response where key=p_key and status='pending';
  return found;
end; $$;

create function public.agenda_blocked() returns jsonb
language sql security definer set search_path = '' as $$
  select coalesce(jsonb_agg(slot),'[]'::jsonb) from booking_private.attempts
  where status in ('pending','unknown','confirmed') and slot::timestamptz > now();
$$;

revoke all on function public.agenda_limit(text,integer) from public,anon,authenticated;
revoke all on function public.agenda_attempt(uuid,text,text,boolean) from public,anon,authenticated;
revoke all on function public.agenda_finish(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.agenda_blocked() from public,anon,authenticated;
grant execute on function public.agenda_limit(text,integer) to service_role;
grant execute on function public.agenda_attempt(uuid,text,text,boolean) to service_role;
grant execute on function public.agenda_finish(uuid,text,jsonb) to service_role;
grant execute on function public.agenda_blocked() to service_role;
commit;
