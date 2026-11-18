import { createHandler } from '../supabase/functions/agenda/gateway.mjs';

export async function runTests() {
 let passed=0;
 const check=(condition,label)=>{if(!condition)throw new Error(label);passed++;};
 const origin='https://anniefilio.github.io';
 const env={BOOKING_ENABLED:'true',ALLOWED_ORIGINS:origin,SUPABASE_URL:'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'server-test-key',DOCPLANNER_BASE_URL:'https://sandbox.example.invalid',
  DOCPLANNER_CLIENT_ID:'test-id',DOCPLANNER_CLIENT_SECRET:'test-secret',BOOKING_SIGNING_SECRET:'test-only-signing-secret-with-at-least-32-characters',
  DOCPLANNER_FACILITY_ID:'1',DOCPLANNER_DOCTOR_ID:'2',DOCPLANNER_ADDRESS_ID:'3',DOCPLANNER_SERVICE_ID:'4'};
 const future=new Date(Date.now()+86400000); future.setUTCHours(23,0,0,0);
 const start=future.toISOString(),day=start.slice(0,10);
 const rows=new Map();let calls=0,failure=false;
 const rpc=async(name,args)=>{
  if(name==='agenda_limit')return true;
  if(name==='agenda_blocked')return [...rows.values()].filter(r=>r.state!=='conflict').map(r=>r.slot);
  if(name==='agenda_attempt') {
   const prior=rows.get(args.p_key);
   if(prior)return prior.fp!==args.p_fingerprint?{state:'mismatch'}:{state:prior.state==='confirmed'?'confirmed':'unknown',response:prior.response};
   if(!args.p_claim)return {state:'new'};
   if([...rows.values()].some(r=>r.slot===args.p_slot&&r.state!=='conflict'))return {state:'unknown'};
   rows.set(args.p_key,{fp:args.p_fingerprint,slot:args.p_slot,state:'pending'});return {state:'claimed'};
  }
  if(name==='agenda_finish'){const r=rows.get(args.p_key);if(r.state!=='pending')return false;r.state=args.p_state;r.response=args.p_response;return true;}
  throw new Error('Unexpected RPC');
 };
 const provider={availability:async()=>[start],book:async()=>{calls++;if(failure)throw new Error('test network failure');return 'test-reference';}};
 const handler=createHandler({env,rpcOverride:rpc,providerOverride:provider});
 const request=(path,method='GET',body,key=crypto.randomUUID(),customOrigin=origin)=>new Request('https://example.supabase.co/functions/v1/agenda/'+path,{method,headers:{Origin:customOrigin,'Content-Type':'application/json','Idempotency-Key':key},...(body?{body:JSON.stringify(body)}:{})});
 let response=await handler(request('availability?date='+day));
 check(response.status===200,'availability');
 const payload=await response.json();const slot=payload.slots[0];
 check(slot.start===start && slot.id.includes('.'),'signed real slot');
 response=await handler(request('availability?date='+day,'GET',null,undefined,'https://wrong.invalid'));
 check(response.status===403,'untrusted origin');
 const disabled=createHandler({env:{ALLOWED_ORIGINS:origin}});
 check((await disabled(request('availability?date='+day))).status===503,'disabled without secrets');
 const body={slotId:slot.id,privacyAccepted:true,patient:{name:'Prueba',surname:'Sistema',phone:'5512345678',email:'test@example.invalid'}};
 check((await handler(request('appointments','POST',{...body,privacyAccepted:false}))).status===422,'required consent');
 check((await handler(request('appointments','POST',{...body,slotId:slot.id.slice(0,-1)+(slot.id.endsWith('0')?'1':'0')}))).status===422,'tampered signature');
 const key=crypto.randomUUID();
 response=await handler(request('appointments','POST',body,key));
 check(response.status===200,'confirmed reservation');
 check((await response.json()).status==='confirmed','confirmation response');
 response=await handler(request('appointments','POST',body,key));
 check(response.status===200&&calls===1,'replay does not reserve twice');
 check((await handler(request('appointments','POST',{...body,patient:{...body.patient,name:'Otra'}},key))).status===422,'key payload mismatch');
 response=await handler(request('availability?date='+day));
 check((await response.json()).slots.length===0,'already claimed slots hidden');
 check((await handler(request('appointments','POST',body))).status===503&&calls===1,'new key cannot duplicate same slot');
 rows.clear();failure=true;
 check((await handler(request('appointments','POST',body))).status===503,'network uncertainty');
 check((await handler(request('appointments','POST',body))).status===503&&calls===2,'uncertain request never retried');
 const limited=createHandler({env,rpcOverride:async()=>false});
 check((await limited(request('availability?date='+day))).status===429,'persistent limiter contract');
 check((await handler(request('availability?date=2099-01-01'))).status===422,'date horizon');
 check((await handler(request('availability','OPTIONS'))).status===204,'CORS preflight');
 rows.clear();let oauthCalls=0,bookRequests=0;
 const adapter=createHandler({env,rpcOverride:rpc,fetcher:async(url,options)=>{
  if(url.endsWith('/oauth/v2/token')){oauthCalls++;return new Response(JSON.stringify({access_token:'private-test-token',expires_in:3600}));}
  check(options.headers.Authorization==='Bearer private-test-token','token only in upstream header');
  if(url.includes('/slots?'))return new Response(JSON.stringify({_items:[{start}]}));
  if(url.endsWith('/book')){bookRequests++;const sent=JSON.parse(options.body);check(sent.address_service_id==='4'&&!sent.patient.marketing_consent,'service controlled by server and no marketing consent');return new Response(JSON.stringify({id:'adapter-reference',status:'booked',start_at:start}));}
  throw new Error('Unexpected upstream path');
 }});
 const adapterSlots=await (await adapter(request('availability?date='+day))).json();
 const adapterResponse=await adapter(request('appointments','POST',{...body,slotId:adapterSlots.slots[0].id}));
 const adapterText=await adapterResponse.text();
 check(adapterResponse.status===200&&bookRequests===1&&oauthCalls===1,'OAuth cache and official booking adapter');
 check(!adapterText.includes('private-test-token')&&!adapterText.includes('test-secret'),'credentials never returned');
 return {passed,providerCalls:calls,note:'Contract tests with in-memory RPC and fake provider, no real reservations.'};
}
