// Shared Edge/Node module. Provider and database credentials stay server-side.
const ZONE = 'America/Mexico_City';
const enc = new TextEncoder();
class ApiError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
const assert = (ok, status = 422, code = 'invalid_request') => { if (!ok) throw new ApiError(status, code); };
const dayKey = date => {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:ZONE, year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(date);
  return ['year','month','day'].map(key=>parts.find(p=>p.type===key).value).join('-');
};
function validDay(raw) {
  assert(typeof raw==='string' && /^\d{4}-\d{2}-\d{2}$/.test(raw));
  const d = new Date(raw+'T12:00:00Z');
  assert(Number.isFinite(+d) && d.toISOString().slice(0,10)===raw);
  const today=dayKey(new Date());
  const last=new Date(today+'T12:00:00Z'); last.setUTCDate(last.getUTCDate()+90);
  assert(raw>=today && raw<=last.toISOString().slice(0,10));
  return raw;
}
function isoStart(start) {
  assert(typeof start==='string' && /(Z|[+-]\d\d:\d\d)$/.test(start),502,'provider_unavailable');
  const dt = new Date(start); assert(Number.isFinite(+dt),502,'provider_unavailable');
  return dt.toISOString();
}
function contact(body) {
  assert(body && body.privacyAccepted===true && body.patient);
  const p={};
  for(const n of ['name','surname','phone','email']) {
    assert(typeof body.patient[n]==='string'); p[n]=body.patient[n].trim();
    assert(!/[\u0000-\u001f]/.test(p[n]));
  }
  assert(p.name.length>=2 && p.name.length<=80 && p.surname.length>=2 && p.surname.length<=100);
  assert(/^\+?[\d ()-]{10,24}$/.test(p.phone)); p.phone=p.phone.replace(/\D/g,'');
  assert(/^\d{10,15}$/.test(p.phone) && p.email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email));
  assert(typeof body.slotId==='string' && body.slotId.length<=1024);
  return p;
}
export function createHandler({env, fetcher=fetch, rpcOverride, providerOverride}={}) {
  const origins = new Set((env.ALLOWED_ORIGINS||'').split(',').filter(Boolean));
  let token, tokenUntil=0;
  async function jsonFetch(url, options={}) {
    try {
      const res=await fetcher(url,{...options,redirect:'error',signal:AbortSignal.timeout(8000)});
      // Bound size even when Content-Length is absent.
      const reader=res.body?.getReader(); const chunks=[]; let size=0;
      if(reader) while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>1048576){await reader.cancel();throw new Error();} chunks.push(value); }
      const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
      const text=new TextDecoder().decode(bytes);
      if(!res.ok) throw new ApiError(res.status===409?409:502,res.status===409?'slot_unavailable':'provider_unavailable');
      return text?JSON.parse(text):null;
    } catch(e) { if(e instanceof ApiError)throw e; throw new ApiError(502,'provider_unavailable'); }
  }
  function configuration() {
    const base=new URL(env.DOCPLANNER_BASE_URL);
    assert(base.protocol==='https:' && base.pathname==='/' && !base.username && !base.password && !base.search && !base.hash,503,'not_configured');
    assert(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.DOCPLANNER_CLIENT_ID && env.DOCPLANNER_CLIENT_SECRET && env.BOOKING_SIGNING_SECRET?.length>=32,503,'not_configured');
    const ids=['FACILITY','DOCTOR','ADDRESS','SERVICE'].map(n=>env['DOCPLANNER_'+n+'_ID']);
    assert(ids.every(x=>/^\d+$/.test(x)),503,'not_configured');
    const duration=Number(env.DOCPLANNER_DURATION_MINUTES||30); assert(Number.isInteger(duration)&&duration>=5&&duration<=240,503,'not_configured');
    return {base:base.origin,ids,duration};
  }
  async function sign(text) {
    const key=await crypto.subtle.importKey('raw',enc.encode(env.BOOKING_SIGNING_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function rpc(name,args={}) {
    if(rpcOverride)return rpcOverride(name,args);
    const result=await jsonFetch(env.SUPABASE_URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(args)}).catch(()=>{throw new ApiError(503,'service_unavailable');});
    return result;
  }
  async function auth(c) {
    if(!token || Date.now()>=tokenUntil) {
      const basic=btoa(env.DOCPLANNER_CLIENT_ID+':'+env.DOCPLANNER_CLIENT_SECRET);
      const p=await jsonFetch(c.base+'/oauth/v2/token',{method:'POST',headers:{Authorization:'Basic '+basic,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials&scope=integration'});
      assert(typeof p?.access_token==='string' && Number(p.expires_in)>0,502,'provider_unavailable');
      token=p.access_token;tokenUntil=Date.now()+Math.max(1,Number(p.expires_in)-60)*1000;
    }
    return {Authorization:'Bearer '+token,Accept:'application/vnd.docplanner+json'};
  }
  const resource=c=>c.base+'/api/v3/integration/facilities/'+c.ids[0]+'/doctors/'+c.ids[1]+'/addresses/'+c.ids[2];
  async function availability(c,day) {
    if(providerOverride)return providerOverride.availability(day);
    // Contemporary Mexico City uses UTC-06; constrain to the 90-day horizon.
    const begin=new Date(day+'T00:00:00-06:00'); const end=new Date(+begin+86400000);
    const q=new URLSearchParams({start:begin.toISOString(),end:end.toISOString()});
    const p=await jsonFetch(resource(c)+'/slots?'+q,{headers:await auth(c)});
    assert(Array.isArray(p?._items) && (p.pages??1)===1 && !p._links?.next,502,'provider_unavailable');
    return [...new Set(p._items.map(item=>isoStart(item.start)))].filter(s=>dayKey(new Date(s))===day && +new Date(s)>Date.now()).sort();
  }
  async function book(c,start,patient) {
    if(providerOverride)return providerOverride.book(start,patient);
    const p=await jsonFetch(resource(c)+'/slots/'+encodeURIComponent(start)+'/book',{method:'POST',headers:{...await auth(c),'Content-Type':'application/json'},body:JSON.stringify({address_service_id:c.ids[3],duration:c.duration,is_returning:false,acted_by:'patient',patient})});
    assert(p?.status==='booked' && ['string','number'].includes(typeof p.id) && String(p.id).trim() && isoStart(p.start_at)===start,502,'confirmation_unknown');
    return String(p.id);
  }
  async function mint(start) {
    const value=btoa(JSON.stringify({start,exp:Date.now()+600000})).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    return value+'.'+await sign(value);
  }
  async function unseal(id) {
    const [value,sig,...rest]=id.split('.');
    assert(value&&sig&&rest.length===0 && /^[a-f0-9]{64}$/.test(sig));
    // WebCrypto constant-time signature verification.
    const key=await crypto.subtle.importKey('raw',enc.encode(env.BOOKING_SIGNING_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    const bytes=new Uint8Array(sig.match(/../g).map(n=>parseInt(n,16)));
    assert(await crypto.subtle.verify('HMAC',key,bytes,enc.encode(value)));
    let p;try{p=JSON.parse(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)));}catch{throw new ApiError(422,'invalid_slot');}
    assert(typeof p.exp==='number' && p.exp>Date.now());const start=isoStart(p.start);
    assert(+new Date(start)>Date.now());validDay(dayKey(new Date(start)));return start;
  }
  async function appointment(c,req) {
    const size=Number(req.headers.get('content-length')||0);assert(size<=4096,413,'body_too_large');
    assert(req.headers.get('content-type')?.split(';')[0]==='application/json',415,'json_required');
    const reader=req.body?.getReader();assert(reader);let sizeRead=0;const chunks=[];
    while(true){const {done,value}=await reader.read();if(done)break;sizeRead+=value.length;if(sizeRead>4096){await reader.cancel();throw new ApiError(413,'body_too_large');}chunks.push(value);}
    const raw=new Uint8Array(sizeRead);let offset=0;for(const part of chunks){raw.set(part,offset);offset+=part.length;}
    let body;try{body=JSON.parse(new TextDecoder().decode(raw));}catch{throw new ApiError(400,'invalid_json');}
    const patient=contact(body),id=req.headers.get('idempotency-key');
    assert(typeof id==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id));
    const fp=await sign(JSON.stringify({patient,slot:body.slotId}));
    const args={p_key:id,p_fingerprint:fp,p_slot:'',p_claim:false};
    let state=await rpc('agenda_attempt',args);
    if(state.state==='confirmed')return state.response;
    assert(state.state!=='mismatch',422,'idempotency_key_reused');assert(state.state==='new',503,'confirmation_unknown');
    const start=await unseal(body.slotId);
    assert((await availability(c,dayKey(new Date(start)))).includes(start),409,'slot_unavailable');
    state=await rpc('agenda_attempt',{...args,p_slot:start,p_claim:true});
    if(state.state==='confirmed')return state.response;
    assert(state.state==='claimed',503,'confirmation_unknown');
    try {
      const reference=await book(c,start,patient);
      const result={status:'confirmed',reference,slotId:body.slotId,start};
      assert(await rpc('agenda_finish',{p_key:id,p_state:'confirmed',p_response:result}),503,'confirmation_unknown');
      return result;
    } catch(e) {
      await rpc('agenda_finish',{p_key:id,p_state:e instanceof ApiError&&e.status===409?'conflict':'unknown',p_response:null}).catch(()=>{});
      throw e;
    }
  }
  return async req=>{
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Origin'};
    let status=200,body;
    try {
      const path=new URL(req.url).pathname.split('/').filter(Boolean).at(-1);
      if(path==='health'&&req.method==='GET')body={status:'ok',bookingEnabled:env.BOOKING_ENABLED==='true'};
      else {
        const origin=req.headers.get('origin');assert(origins.has(origin),403,'origin_not_allowed');headers['Access-Control-Allow-Origin']=origin;
        if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Idempotency-Key'}});
        assert(env.BOOKING_ENABLED==='true',503,'booking_not_enabled');const c=configuration();
        assert(await rpc('agenda_limit',{p_bucket:req.method==='POST'?'global_booking':'global_availability',p_max:req.method==='POST'?12:120}),429,'too_many_requests');
        if(path==='availability'&&req.method==='GET') {
          const date=validDay(new URL(req.url).searchParams.get('date'));
          const blocked=new Set(await rpc('agenda_blocked')); const starts=(await availability(c,date)).filter(s=>!blocked.has(s));
          body={date,timeZone:ZONE,slots:await Promise.all(starts.map(async start=>({id:await mint(start),start})))};
        } else if(path==='appointments'&&req.method==='POST')body=await appointment(c,req);
        else throw new ApiError(404,'not_found');
      }
    } catch(e) {status=e instanceof ApiError?e.status:503;body={error:e instanceof ApiError?e.code:'service_unavailable'};}
    return new Response(JSON.stringify(body),{status,headers});
  };
}
