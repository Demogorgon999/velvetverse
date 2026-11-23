// @vitest-environment node
import {mkdtempSync,writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {it,expect,vi,beforeEach} from 'vitest'
import {GuestLiveGate,guestPreflight} from '../scripts/tester/guestLivePolicy.mjs'
import {createGuestLiveService} from '../scripts/tester/guestLiveService.mjs'
import {createSmokeResponsesTransport} from '../scripts/acceptance/responsesTransport.mjs'
import {buildTesterBody} from '../scripts/tester/projection.mjs'
import {smokePolicy} from '../scripts/acceptance/livePolicy.mjs'
beforeEach(()=>{vi.spyOn(Date,'now').mockReturnValue(Date.parse('2026-11-18T06:00:00Z'))})
const root=()=>mkdtempSync(join(tmpdir(),'vv-guest-live-test-'))
const scope={testerId:'guest',storyId:'story-one',characterId:1},input={spoken:'Shall we carry the blue lantern to the bridge?',visibleAction:'',privateThought:'LIVE_GUEST_PRIVATE_CANARY',shareObserved:true},context={sessionTag:'a'.repeat(32)}
it('uses the real guest policy/serializer/auth/player with injected transport and preserves progress/expiry across restart',async()=>{
 const path=root(),password='synthetic-long-guest-password-only',transport=vi.fn(async()=>({text:'Seraphina lifts the lantern. "[MOCK] Let us wait by the bridge."',usage:{inputUnits:100,outputUnits:30}}))
 let clock=Date.now(),service=await createGuestLiveService({root:path,password,transport,now:()=>clock})
 let internal=''
 const request=(route:string,body?:object,cookie='',csrf='')=>fetch(internal+'/velvetverse'+route,{method:body?'POST':'GET',headers:{'X-Forwarded-Proto':'https','X-Forwarded-Host':'guest.example.test',...(body?{Origin:'https://guest.example.test','Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined})
 try{
  await new Promise<void>(resolve=>service.server.listen(0,'127.0.0.1',resolve));internal=`http://127.0.0.1:${(service.server.address() as {port:number}).port}`
  expect((await fetch(internal+'/velvetverse/')).status).toBe(403)
  const page=await request('/');expect(await page.text()).toContain('/player/player.js');expect(page.headers.get('set-cookie')).toBeNull()
  expect((await request('/tester/session')).status).toBe(401)
  expect((await request('/tester/login',{username:'local-owner',password})).status).toBe(401)
  const login=await request('/tester/login',{username:'guest',password}),cookie=login.headers.get('set-cookie')!.split(';')[0],auth=await login.json()
  expect(login.headers.get('set-cookie')).toContain('; Secure');expect(auth.mode).toBe('live')
  expect((await request('/acceptance/status?testerId=local-owner&storyId=story-one&characterId=1',undefined,cookie)).status).toBe(403)
  expect((await request('/acceptance/turn',{scope,input,requestId:'no-consent'},cookie,auth.csrf)).status).toBe(403)
  const turn=await request('/acceptance/turn',{scope,input,requestId:'one',providerConsent:'openai-tester'},cookie,auth.csrf)
  expect(turn.status).toBe(200);const result=await turn.json();expect(result.capture).not.toContain('LIVE_GUEST_PRIVATE_CANARY');expect(result.capture).not.toContain('local-owner');expect(result.capture).toContain('blue lantern');expect(transport).toHaveBeenCalledOnce()
  const body=JSON.parse(result.capture);expect(body).toMatchObject({store:false,stream:false,max_output_tokens:256});expect(body).not.toHaveProperty('tools')
  const weather=await request('/acceptance/turn',{scope,input:{...input,spoken:'Current weather in JHB?'},requestId:'weather',providerConsent:'openai-tester'},cookie,auth.csrf)
  expect((await weather.json()).redirected).toBe(true);expect(transport).toHaveBeenCalledOnce()
  expect((await request('/acceptance/close',{},cookie,auth.csrf)).status).toBe(403)
  const expiry=service.gate.leaseExpiresAt;await service.stop();clock+=10000
  service=await createGuestLiveService({root:path,password,transport,now:()=>clock});expect(service.gate.leaseExpiresAt).toBe(expiry)
  await new Promise<void>(resolve=>service.server.listen(0,'127.0.0.1',resolve));internal=`http://127.0.0.1:${(service.server.address() as {port:number}).port}`
  expect((await request('/tester/session',undefined,cookie)).status).toBe(401)
  const fresh=await request('/tester/login',{username:'guest',password}),freshCookie=fresh.headers.get('set-cookie')!.split(';')[0]
  const status=await(await request('/acceptance/status?testerId=guest&storyId=story-one&characterId=1',undefined,freshCookie)).json()
  expect(status.save.transcript).toHaveLength(1);expect(status.budget.attemptsRemaining).toBe(19)
 }finally{await service.stop()}
},20000)
it('enforces 20 durable attempts, one concurrency slot, duplicate replay and original expiry',async()=>{
 const path=root();let clock=Date.parse('2026-11-18T06:00:00Z'),gate=new GuestLiveGate(path,{now:()=>clock});const expiry=gate.leaseExpiresAt
 const work=vi.fn(async({save})=>({save,reply:'[MOCK]',usage:{inputUnits:100,outputUnits:30}}))
 try{
  for(let n=0;n<20;n++){clock+=61000;if(n===8){await gate.close();gate=new GuestLiveGate(path,{now:()=>clock});expect(gate.leaseExpiresAt).toBe(expiry)}await gate.execute(scope,'turn-'+n,input,work,{sessionTag:(n%2?'b':'a').repeat(32)})}
  expect(gate.terminal()).toBe(true);await expect(gate.execute(scope,'extra',input,work,{sessionTag:'c'.repeat(32)})).rejects.toThrow('twenty_attempts');expect(work).toHaveBeenCalledTimes(20)
  await gate.execute(scope,'turn-19',input,work,context);expect(work).toHaveBeenCalledTimes(20)
  await gate.close();expect(()=>guestPreflight(path,{now:clock})).toThrow('twenty_attempts');clock=expiry;expect(()=>guestPreflight(path,{now:clock})).toThrow('expired')
 }finally{await gate.close()}
 const concurrent=new GuestLiveGate(root());let release:()=>void=()=>{};const pending=new Promise<void>(resolve=>{release=resolve})
 try{const first=concurrent.execute(scope,'one',input,async({save})=>{await pending;return{save,reply:'[MOCK]',usage:{inputUnits:100,outputUnits:30}}},context);await vi.waitFor(()=>expect(Object.keys(concurrent.data.entries)).toHaveLength(1));expect(concurrent.terminal()).toBe(false);await expect(concurrent.execute(scope,'two',input,work,context)).rejects.toThrow('one_global');release();await first}finally{await concurrent.close()}
})
it('fails closed for held, corrupted, missing-window and spent budgets; expiry shuts down service',async()=>{
 for(const fault of ['held','corrupt','missing-window','missing-ledger','budget']){
  const path=root();const gate=new GuestLiveGate(path)
  if(fault==='held'){await expect(gate.execute(scope,'timeout',input,async()=>{throw new Error('synthetic ambiguous timeout')},context)).rejects.toThrow();expect(gate.summary().heldMicros).toBe(7680)}
  if(fault==='budget'){gate.data.spentMicros=225000;gate.persist();await expect(gate.execute(scope,'cap',input,vi.fn(),context)).rejects.toThrow('budget_exhausted')}
  await gate.close()
  if(fault==='corrupt')writeFileSync(join(path,'ledger.json'),'{bad')
  if(fault==='missing-window'){const {unlinkSync}=await import('node:fs');unlinkSync(join(path,'window.json'))}
  if(fault==='missing-ledger'){const {unlinkSync}=await import('node:fs');unlinkSync(join(path,'ledger.json'))}
  expect(()=>guestPreflight(path)).toThrow()
 }
 let clock=Date.now();const terminal=vi.fn(),path=root(),service=await createGuestLiveService({root:path,password:'synthetic-long-guest-password-only',transport:vi.fn(),now:()=>clock,onTerminal:terminal})
 await new Promise<void>(resolve=>service.server.listen(0,'127.0.0.1',resolve));clock=service.gate.leaseExpiresAt
 await vi.waitFor(()=>expect(service.gate.closed).toBe(true),{timeout:3000});expect(service.server.listening).toBe(false);expect(terminal).toHaveBeenCalledOnce();await service.stop()
})
it('bounds the actual Responses adapter to 20 injected dispatches with fixed no-tool/store-false requests and no retry',async()=>{
 const fake=vi.fn(async(endpoint:string,options:{body:string})=>{
  expect(endpoint).toBe('https://api.openai.com/v1/responses');const body=JSON.parse(options.body);expect(body).toMatchObject({model:smokePolicy.model,store:false,stream:false,max_output_tokens:256});expect(body).not.toHaveProperty('tools')
  return new Response(JSON.stringify({model:smokePolicy.model,service_tier:'default',status:'completed',usage:{input_tokens:100,output_tokens:30},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Seraphina lifts the lantern. "[MOCK] We can wait."'}]}]}))
 })
 const adapter=createSmokeResponsesTransport({key:'fixed-synthetic-transport-fixture',approved:true,maxAttempts:20,fetchImpl:fake,buildBody:buildTesterBody})
 const packet={mode:'acceptance-fake-only',characterId:1,storyScopeId:'story-one',alias:null,observedSpoken:'Shall we wait by the bridge?',observedAction:'',memories:[],recentDialogue:[]}
 for(let n=0;n<20;n++)await adapter(packet,new AbortController().signal)
 await expect(adapter(packet,new AbortController().signal)).rejects.toThrow('transport_attempt_limit_no_retry');expect(fake).toHaveBeenCalledTimes(20)
})
