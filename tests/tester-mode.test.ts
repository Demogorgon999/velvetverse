// @vitest-environment node
import { mkdtempSync,readFileSync,writeFileSync,mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach,expect,it,vi ,beforeEach} from 'vitest'
import { TesterGate,testerPolicy,validateLiveTesterApproval,preflightTesterLedger } from '../scripts/tester/policy.mjs'
import { syntheticAccounts,TesterAuth } from '../scripts/tester/auth.mjs'
import { createTesterServer } from '../scripts/tester/server.mjs'
import { approvedRecentDialogue,buildTesterBody } from '../scripts/tester/projection.mjs'
import { createSmokeResponsesTransport } from '../scripts/acceptance/responsesTransport.mjs'
import { needsStoryRedirect,storyRedirect } from '../scripts/tester/guardrails.mjs'

beforeEach(()=>{vi.spyOn(Date,'now').mockReturnValue(Date.parse('2026-11-18T06:00:00Z'))})
const cleanups: (()=>Promise<unknown>)[]=[]
afterEach(async()=>{vi.restoreAllMocks();for(const cleanup of cleanups.splice(0).reverse())await cleanup()})
const file=()=>join(mkdtempSync(join(tmpdir(),'vv-tester-offline-')),'ledger.json')
const scope={testerId:'fixture-a',storyId:'story-one',characterId:1}
const ctx={sessionTag:'a'.repeat(32)}
const input={spoken:'Should we take the blue lantern to the bridge?',visibleAction:'Unrolls a map.',privateThought:'PRIVATE_AMBER_LARK',shareObserved:true}
it('routes explicit live information locally while allowing fictional weather and ignoring private thoughts',()=>{
  for(const spoken of ['What is the current weather in JHB?','Give me latest real-world news.','Look up the forecast online.'])expect(needsStoryRedirect({...input,spoken})).toBe(true)
  for(const spoken of ['In our fictional scene, what is the weather today?','Rain falls over the bridge. Shall we shelter?'])expect(needsStoryRedirect({...input,spoken,privateThought:'latest news in JHB'})).toBe(false)
})
async function start(path=file(),clock=()=>Date.now()){
  const gate=new TesterGate(path,testerPolicy(),{now:clock})
  const packets: string[]=[]
  const transport=vi.fn(async packet=>{packets.push(JSON.stringify(buildTesterBody(packet)));return{text:'Seraphina lifts the lantern. "[MOCK] We can study the bridge."',usage:{inputUnits:100,outputUnits:30},measurement:{latencyMs:2}}})
  const service=await createTesterServer({gate,accounts:syntheticAccounts(),transport,now:clock})
  await new Promise<void>(resolve=>service.server.listen(0,'127.0.0.1',resolve))
  cleanups.push(()=>service.stop())
  const origin=`http://127.0.0.1:${(service.server.address() as {port:number}).port}`
  const request=async(path:string,body?:object,auth?:{cookie:string;csrf:string},options:{origin?:string;csrf?:string}={})=>fetch(origin+'/velvetverse'+path,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{Origin:options.origin??origin,'Content-Type':'application/json','X-CSRF-Token':options.csrf??auth?.csrf??''}),...(auth?{Cookie:auth.cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)})
  const login=async(username='alice',password='fictional-alice-only')=>{const response=await request('/tester/login',{username,password});expect(response.status).toBe(200);const value=await response.json();const raw=response.headers.get('set-cookie')!;expect(raw).toContain('HttpOnly');expect(raw).toContain('SameSite=Strict');expect(raw).toContain('Path=/velvetverse');return{cookie:raw.split(';')[0],csrf:value.csrf,accountId:value.accountId}}
  return{gate,service,transport,packets,request,login,origin}
}
it('enforces authentication on every data route, CSRF/origin, account ownership, logout and expiration',async()=>{
  let now=Date.now();const app=await start(undefined,()=>now)
  expect(app.service.server.maxConnections).toBe(16)
  expect((await app.request('/acceptance/status?testerId=fixture-a&storyId=story-one&characterId=1')).status).toBe(401)
  expect((await app.request('/acceptance/new-session',{scope})).status).toBe(401)
  const alice=await app.login()
  expect((await app.request('/acceptance/new-session',{scope},alice,{csrf:'wrong'})).status).toBe(403)
  expect((await app.request('/acceptance/new-session',{scope},alice,{origin:'https://evil.invalid'})).status).toBe(403)
  expect((await app.request('/acceptance/status?testerId=fixture-b&storyId=story-one&characterId=1',undefined,alice)).status).toBe(403)
  expect((await app.request('/acceptance/turn',{scope:{...scope,testerId:'fixture-b'},requestId:'forged',input},alice)).status).toBe(403)
  expect((await app.request('/acceptance/close',{},alice)).status).toBe(403)
  expect(app.transport).not.toHaveBeenCalled()
  await app.request('/tester/logout',{},alice)
  expect((await app.request('/tester/session',undefined,alice)).status).toBe(401)
  const fresh=await app.login();now+=31*60000
  expect((await app.request('/tester/session',undefined,fresh)).status).toBe(401)
})
it('runs arbitrary multiple turns with scoped recent quotes, reload/relogin continuity and separate accounts/stories',async()=>{
  const path=file();const app=await start(path);const alice=await app.login()
  const post=(id:string,spoken:string)=>app.request('/acceptance/turn',{scope,requestId:id,input:{...input,spoken}},alice)
  expect((await post('first','I promise to bring a blue lantern to the bridge.')).status).toBe(200)
  expect((await post('second','Which promise should guide us now?')).status).toBe(200)
  expect(app.packets[1]).toContain('I promise to bring a blue lantern')
  expect(app.packets.join()).not.toContain('PRIVATE_AMBER_LARK')
  expect(app.packets[1]).toContain('recentDialogue')
  expect(JSON.stringify(app.gate.getSave(scope).state)).toContain('blue lantern')
  expect(JSON.parse(JSON.parse(app.packets[1]).input[1].content)).not.toHaveProperty('state')
  const duplicate=await post('second','Which promise should guide us now?');expect((await duplicate.json()).replay).toBe(true);expect(app.transport).toHaveBeenCalledTimes(2)
  await app.request('/tester/logout',{},alice);const reentered=await app.login()
  const reload=await (await app.request('/acceptance/status?testerId=fixture-a&storyId=story-one&characterId=1',undefined,reentered)).json()
  expect(reload.save.transcript).toHaveLength(2);expect(reload.save.state).toBeUndefined()
  const session=await(await app.request('/acceptance/new-session',{scope},reentered)).json();expect(session.save.conversation).toBe(2);expect(session.save.transcript).toHaveLength(0)
  const bob=await app.login('bob','fictional-bob-only')
  const b=await(await app.request('/acceptance/status?testerId=fixture-b&storyId=story-one&characterId=1',undefined,bob)).json();expect(b.save.transcript).toHaveLength(0)
  const other=await(await app.request('/acceptance/status?testerId=fixture-a&storyId=story-two&characterId=1',undefined,reentered)).json();expect(other.save.transcript).toHaveLength(0)
  await app.service.stop();cleanups.pop()
  const restarted=await start(path);const newLogin=await restarted.login()
  const stored=await(await restarted.request('/acceptance/status?testerId=fixture-a&storyId=story-one&characterId=1',undefined,newLogin)).json();expect(stored.save.conversation).toBe(2)
  expect(stored.budget.spentMicros).toBe(420)
})
it('fails closed for unlabelled history, wrong scopes, changed label revision and excessive body',()=>{
  const base={version:1,id:'one',origin:'server-observed-turn',visibility:'provider-shared',accountId:'fixture-a',storyId:'story-one',characterId:1,labelRevision:0,spoken:'A shared boat',visibleAction:'',reply:'A witnessed reply',replySource:'projected-provider-output'}
  const save={labels:{events:[]},dialogueEvents:[base,{...base,id:'two',accountId:'fixture-b',spoken:'OTHER_ACCOUNT'},{...base,id:'three',privateThought:'SECRET'},{...base,id:'four',visibility:'private'}]}
  expect(approvedRecentDialogue(save,scope)).toEqual([{spoken:'A shared boat',visibleAction:'',reply:'A witnessed reply'}])
  expect(approvedRecentDialogue({...save,labels:{events:[{}]}},scope)).toEqual([])
  expect(approvedRecentDialogue({transcript:[{spoken:'LEGACY_SECRET'}]},scope)).toEqual([])
})
it('reserves atomically, limits concurrency/rate/session/account, and holds ambiguity over restart',async()=>{
  const path=file();const gate=new TesterGate(path,testerPolicy());cleanups.push(async()=>{if(!gate.closed)await gate.close()})
  let finish!:()=>void
  const work=vi.fn(async({save})=>{const disk=JSON.parse(readFileSync(path,'utf8'));expect(Object.values(disk.entries)[0]).toMatchObject({status:'reserved',reservedMicros:7680});await new Promise<void>(resolve=>{finish=resolve});return{save,reply:'Synthetic reply',usage:{inputUnits:100,outputUnits:30}}})
  const first=gate.execute(scope,'one',input,work,ctx);await vi.waitFor(()=>expect(work).toHaveBeenCalledOnce())
  await expect(gate.execute({...scope,storyId:'other'},'two',input,work,ctx)).rejects.toThrow('one_global')
  finish();await first
  await expect(gate.execute(scope,'unknown',input,async()=>{throw new Error('fixture unknown')},ctx)).rejects.toThrow()
  await gate.close();const restarted=new TesterGate(path,testerPolicy());cleanups.push(()=>restarted.close())
  expect(restarted.summary().heldMicros).toBe(7680)
  await expect(restarted.execute({...scope,storyId:'other'},'no-retry',input,work,ctx)).rejects.toThrow('ambiguous_attempt')
  expect(work).toHaveBeenCalledOnce()
})
it('rejects missing approval, stale credit assertions, invalid lease, and supports multiple injected Responses attempts without retries',async()=>{
  expect(()=>validateLiveTesterApproval({})).toThrow()
  const config={approvedFor:'multi-turn-local-tester',noPaidBilling:true,proxyEnabled:false,origin:'http://127.0.0.1:5190',verifiedAt:new Date(Date.now()).toISOString(),remainingPromoUsd:24,promoExpiresAt:'2026-11-24T23:00:00Z',capMicros:1000000,accounts:[{id:'tester-one'}]}
  expect(validateLiveTesterApproval(config).capMicros).toBe(1000000)
  expect(()=>validateLiveTesterApproval({...config,verifiedAt:'2026-11-01T00:00:00Z'})).toThrow()
  expect(()=>validateLiveTesterApproval({...config,model:'untrusted-override'})).toThrow()
  expect(()=>testerPolicy({creditCeilingMicros:1000000,capMicros:1000000})).toThrow()
  expect(()=>new TesterGate(file(),testerPolicy(),{leaseExpiresAt:NaN})).toThrow()
  const fetchImpl=vi.fn(async()=>Response.json({model:'gpt-5.4-mini-2026-03-17',service_tier:'default',status:'completed',usage:{input_tokens:100,output_tokens:30},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Seraphina studies the lantern.'}]}]}))
  const transport=createSmokeResponsesTransport({key:'synthetic-not-real',approved:true,maxAttempts:100,buildBody:buildTesterBody,fetchImpl})
  const packet={mode:'acceptance-fake-only',characterId:1,storyScopeId:'story-one',alias:null,observedSpoken:'A bridge scene',observedAction:'',memories:[],recentDialogue:[]}
  await transport(packet,new AbortController().signal);await transport(packet,new AbortController().signal)
  expect(fetchImpl).toHaveBeenCalledTimes(2);expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({store:false,max_output_tokens:256,service_tier:'default'})
})
it('bounds login attempts and revokes old session cookies',()=>{
  const auth=new TesterAuth(syntheticAccounts());for(let i=0;i<5;i++)expect(()=>auth.login('alice','bad')).toThrow('login_failed')
  expect(()=>auth.login('alice','fictional-alice-only')).toThrow('rate_limited')
})
it('enforces a real reservation cap and lease/turn/session limits without dispatch beyond them',async()=>{
  let now=Date.now();const path=file();const gate=new TesterGate(path,testerPolicy({capMicros:20000}),{now:()=>now,leaseExpiresAt:now+1000});cleanups.push(()=>gate.close())
  const work=vi.fn(async({save})=>({save,reply:'Synthetic',usage:{inputUnits:8704,outputUnits:256}}))
  await gate.execute(scope,'cap-one',input,work,ctx)
  await expect(gate.execute(scope,'cap-two',input,work,ctx)).rejects.toThrow('budget_exhausted')
  now+=1001;await expect(gate.execute(scope,'expired',input,work,ctx)).rejects.toThrow('demo_lease_expired')
  expect(work).toHaveBeenCalledOnce()
  const rate=new TesterGate(file(),testerPolicy());cleanups.push(()=>rate.close());const tiny=async({save})=>({save,reply:'Synthetic',usage:{inputUnits:1,outputUnits:1}})
  for(let n=0;n<3;n++)await rate.execute(scope,'rate-'+n,input,tiny,ctx)
  await expect(rate.execute(scope,'rate-four',input,tiny,ctx)).rejects.toThrow('three_turns_per_minute')
  const sessionEntries=Object.values(rate.data.entries);for(let n=3;n<20;n++)rate.data.entries['fixture-'+n]={...sessionEntries[0],createdAt:0,requestId:'fixture-'+n}
  await expect(rate.execute(scope,'session-cap',input,tiny,ctx)).rejects.toThrow('tester_attempt_limit')
})
it('correction/revocation excludes obsolete quotes and labels from captured final requests after reload',async()=>{
  const app=await start();const alice=await app.login()
  const label=(action:string,value:string)=>app.request('/acceptance/label',{scope,action,factId:'alias',value,provenance:'observed',visibility:'provider-shared',witnessed:true},alice)
  expect((await label('add','OLD_ALIAS_CANARY')).status).toBe(200)
  expect((await app.request('/acceptance/turn',{scope,requestId:'old-turn',input:{...input,spoken:'OLD_ALIAS_CANARY crosses the bridge.'}},alice)).status).toBe(200)
  expect((await label('correct','Indigo')).status).toBe(200)
  const corrected=await app.request('/acceptance/turn',{scope,requestId:'corrected-turn',input},alice);expect(corrected.status).toBe(200)
  const captured=(await corrected.json()).capture;expect(captured).toContain('Indigo');expect(captured).not.toContain('OLD_ALIAS_CANARY')
  expect((await label('revoke','')).status).toBe(200)
  await app.request('/tester/logout',{},alice);const again=await app.login()
  const revoked=await app.request('/acceptance/turn',{scope,requestId:'revoked-turn',input},again);expect(revoked.status).toBe(200)
  const revokedBody=(await revoked.json()).capture;expect(revokedBody).not.toContain('Indigo');expect(revokedBody).not.toContain('OLD_ALIAS_CANARY')
})
it('keeps late reply state bound to the authenticated actor during logout/account switch',async()=>{
  const app=await start();const alice=await app.login()
  let release!:(value:object)=>void
  app.transport.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve}))
  const pending=app.request('/acceptance/turn',{scope,requestId:'delayed-alice',input},alice)
  await vi.waitFor(()=>expect(app.transport).toHaveBeenCalledOnce())
  await app.request('/tester/logout',{},alice)
  const bob=await app.login('bob','fictional-bob-only')
  expect((await app.request('/acceptance/turn',{scope:{...scope,testerId:'fixture-b'},requestId:'bob-pending',input},bob)).status).toBe(409)
  release({text:'Seraphina studies the bridge. "[MOCK] Let us wait."',usage:{inputUnits:100,outputUnits:30}})
  expect((await pending).status).toBe(200)
  expect(app.gate.getSave(scope).transcript).toHaveLength(1)
  expect(app.gate.getSave({...scope,testerId:'fixture-b'}).transcript).toHaveLength(0)
  expect((await app.request('/acceptance/status?testerId=fixture-a&storyId=story-one&characterId=1',undefined,bob)).status).toBe(403)
})
it('checks immutable allocated policy before key entry while refreshing balance approval without resetting progress',async()=>{
  const account={id:'tester-one'}
  const config={approvedFor:'multi-turn-local-tester',noPaidBilling:true,proxyEnabled:false,origin:'http://127.0.0.1:5190',verifiedAt:new Date(Date.now()).toISOString(),remainingPromoUsd:24,promoExpiresAt:'2026-11-24T23:00:00Z',capMicros:1000000,accounts:[account]}
  const policy=validateLiveTesterApproval(config)
  expect(validateLiveTesterApproval({...config,remainingPromoUsd:23})).toEqual(policy)
  const path=file();const gate=new TesterGate(path,policy)
  expect(()=>preflightTesterLedger(path,policy)).toThrow('locked')
  await gate.close();expect(()=>preflightTesterLedger(path,policy)).not.toThrow()
  expect(()=>preflightTesterLedger(path,{...policy,capMicros:200000})).toThrow('invalid_ledger')
})
it('rejects array ledger containers before boot or reservation instead of losing non-index entries on serialization',async()=>{
  const path=file(),policy=testerPolicy();const gate=new TesterGate(path,policy);await gate.close()
  const original=JSON.parse(readFileSync(path,'utf8'))
  for(const field of ['entries','saves']){
    writeFileSync(path,JSON.stringify({...original,[field]:[]}))
    expect(()=>preflightTesterLedger(path,policy)).toThrow('invalid_ledger')
    expect(()=>new TesterGate(path,policy)).toThrow('invalid_ledger')
  }
})
it('redirects repeated live-info requests before reservation or engine state and still dispatches fictional weather',async()=>{
  const app=await start()
  expect((await app.request('/acceptance/turn',{scope,requestId:'anonymous-weather',input:{...input,spoken:'Current weather in JHB?'}})).status).toBe(401)
  const alice=await app.login()
  for(let n=0;n<5;n++){
    const response=await app.request('/acceptance/turn',{scope,requestId:`weather-${n}`,input:{...input,spoken:'What is the current weather in JHB?'}},alice)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({reply:storyRedirect,redirected:true,engineReceipt:{finalDispatches:0},measurement:{costMicros:0}})
  }
  expect(app.transport).not.toHaveBeenCalled();expect(app.gate.summary().spentMicros).toBe(0)
  expect(app.gate.getSave(scope).transcript).toHaveLength(0)
  expect((await app.request('/acceptance/turn',{scope,requestId:'fictional-weather',input:{...input,spoken:'In our fictional scene, what is the weather today?'}},alice)).status).toBe(200)
  expect(app.transport).toHaveBeenCalledOnce()
})
it('persists the normal HTTP account burst limit across restart without another provider call',async()=>{
  const path=file();const app=await start(path);const alice=await app.login()
  for(let n=0;n<3;n++)expect((await app.request('/acceptance/turn',{scope,requestId:`turn-${n}`,input},alice)).status).toBe(200)
  expect((await app.request('/acceptance/turn',{scope,requestId:'fourth',input},alice)).status).toBe(429)
  expect(app.transport).toHaveBeenCalledTimes(3)
  await app.service.stop();cleanups.pop()
  const restarted=await start(path);const fresh=await restarted.login()
  expect((await restarted.request('/acceptance/turn',{scope,requestId:'after-restart',input},fresh)).status).toBe(429)
  expect(restarted.transport).not.toHaveBeenCalled()
})
it('rejects unrequested response actions with known usage and no retry; outgoing body has no tools',async()=>{
  const packet={mode:'acceptance-fake-only',characterId:1,storyScopeId:'story-one',alias:null,observedSpoken:'A fictional bridge scene',observedAction:'',memories:[],recentDialogue:[]}
  const body=buildTesterBody(packet)
  expect(body).toMatchObject({store:false,max_output_tokens:256,stream:false})
  for(const field of ['tools','tool_choice','previous_response_id','conversation'])expect(body).not.toHaveProperty(field)
  const fetchImpl=vi.fn(async()=>Response.json({model:'gpt-5.4-mini-2026-03-17',service_tier:'default',status:'completed',usage:{input_tokens:100,output_tokens:30},output:[{type:'function_call',name:'unrequested_placeholder',arguments:'{}'}]}))
  const transport=createSmokeResponsesTransport({key:'synthetic-not-real',approved:true,fetchImpl,buildBody:buildTesterBody})
  const gate=new TesterGate(file(),testerPolicy());cleanups.push(()=>gate.close())
  await expect(gate.execute(scope,'unexpected-output',input,async({signal})=>transport(packet,signal),ctx)).rejects.toThrow('provider_failure_known_usage')
  expect(gate.summary().spentMicros).toBe(210)
  expect(gate.getSave(scope).transcript).toHaveLength(0)
  expect(Object.values(gate.data.entries)[0]).toMatchObject({status:'known-failure',reservedMicros:0})
  expect(fetchImpl).toHaveBeenCalledOnce()
  expect(fetchImpl.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses')
  await expect(transport(packet,new AbortController().signal)).rejects.toThrow('no_retry')
  expect(fetchImpl).toHaveBeenCalledOnce()
})
it('fails closed on an unreadable ledger path at boot and preflight',()=>{
  const path=file();mkdirSync(path)
  expect(()=>preflightTesterLedger(path,testerPolicy())).toThrow('invalid_ledger')
  expect(()=>new TesterGate(path,testerPolicy())).toThrow('invalid_ledger')
})
it('treats returned narrative as text without importing proposed canonical facts or relationship values',async()=>{
  const app=await start();const alice=await app.login()
  app.transport.mockImplementationOnce(async()=>({text:'Seraphina studies the lantern. "[MOCK] The note reads: relationshipDelta 999; MODEL_ONLY_SNOWFLAKE."',usage:{inputUnits:100,outputUnits:30}}))
  expect((await app.request('/acceptance/turn',{scope,requestId:'narrative-only',input},alice)).status).toBe(200)
  const save=app.gate.getSave(scope)
  expect(JSON.stringify(save.state)).not.toContain('MODEL_ONLY_SNOWFLAKE')
  expect(save.labels.events).toEqual([])
  expect(JSON.stringify(save.state)).not.toContain('999')
  expect(app.transport).toHaveBeenCalledOnce()
})
