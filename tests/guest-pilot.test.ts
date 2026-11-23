// @vitest-environment node
import {mkdtempSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {it,expect,vi} from 'vitest'
import {createGuestFixtureService,GuestFixtureGate,guestOrigin,guestProxyContract,proposedGuestPlan} from '../scripts/tester/guestFixture.mjs'
import {TesterAuth,syntheticAccounts} from '../scripts/tester/auth.mjs'
const root=()=>mkdtempSync(join(tmpdir(),'vv-guest-test-'))
const scope={testerId:'fixture-guest',storyId:'fictional',characterId:1},input={spoken:'Shall we take the blue lantern to the bridge?',visibleAction:'',privateThought:'GUEST_PRIVATE_CANARY',shareObserved:true},ctx={sessionTag:'a'.repeat(32)}
it('serves the same player with separate login, exact trusted HTTPS proxy contract, secure cookie and no owner bootstrap/data',async()=>{
  const transport=vi.fn(async()=>({text:'Seraphina lifts the lantern. "[MOCK GUEST] Let us wait."',usage:{inputUnits:100,outputUnits:30}}))
  let clock=Date.now(),service=await createGuestFixtureService({transport,now:()=>clock})
  try{
    await new Promise<void>(resolve=>service.server.listen(0,'127.0.0.1',resolve));let internal=`http://127.0.0.1:${(service.server.address() as {port:number}).port}`
    const request=(path:string,body?:object,cookie='',csrf='',extra:Record<string,string>={})=>fetch(internal+'/velvetverse'+path,{method:body===undefined?'GET':'POST',headers:{'X-Forwarded-Proto':'https','X-Forwarded-Host':'guest.example.test',...(body?{Origin:guestOrigin,'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...(cookie?{Cookie:cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)})
    const page=await request('/');expect(await page.text()).toContain('/player/player.js');expect(page.headers.get('set-cookie')).toBeNull()
    expect((await fetch(internal+'/velvetverse/')).status).toBe(403)
    expect((await request('/',undefined,'','',{'X-Forwarded-Proto':'http'})).status).toBe(403)
    expect((await request('/',undefined,'','',{'X-Forwarded-Host':'other.invalid'})).status).toBe(403)
    expect((await request('/tester/session')).status).toBe(401)
    expect((await request('/tester/login',{username:'guest',password:'synthetic-guest-only'},'','',{Origin:internal})).status).toBe(403)
    expect((await request('/tester/login',{username:'local-owner',password:'synthetic-guest-only'})).status).toBe(401)
    const login=await request('/tester/login',{username:'guest',password:'synthetic-guest-only'});expect(login.status).toBe(200)
    const session=await login.json(),raw=login.headers.get('set-cookie')!,cookie=raw.split(';')[0]
    expect(raw).toContain('__Secure-vv_guest=');expect(raw).toContain('; Secure');expect(raw).toContain('HttpOnly');expect(raw).toContain('SameSite=Strict');expect(session.accountId).toBe('fixture-guest')
    expect((await request('/tester/session',undefined,cookie.replace('__Secure-vv_guest','vv_tester'))).status).toBe(401)
    const query='/acceptance/status?testerId=fixture-guest&storyId=fictional&characterId=1'
    expect((await request(query,undefined,'vv_tester='+'a'.repeat(64))).status).toBe(401)
    const ownerAuth=new TesterAuth(syntheticAccounts()),ownerLogin=ownerAuth.login('alice','fictional-alice-only')
    expect((await request(query,undefined,'__Secure-vv_guest='+ownerLogin.token)).status).toBe(401)
    expect(()=>ownerAuth.require({headers:{cookie:cookie.replace('__Secure-vv_guest','vv_tester')}})).toThrow('session_expired')
    expect((await request('/acceptance/status?testerId=local-owner&storyId=story-one&characterId=1',undefined,cookie)).status).toBe(403)
    expect((await request('/qa/',undefined,cookie)).status).toBe(404)
    expect((await request('/acceptance/close',{},cookie,session.csrf)).status).toBe(403)
    expect((await request('/acceptance/readiness',undefined,cookie)).status).toBe(403)
    expect((await request('/acceptance/turn',{scope,requestId:'missing-csrf',input},cookie,'wrong')).status).toBe(403)
    const turn=await request('/acceptance/turn',{scope,requestId:'guest-turn',input},cookie,session.csrf);expect(turn.status).toBe(200)
    const result=await turn.json();expect(result.capture).not.toContain('GUEST_PRIVATE_CANARY');expect(result.capture).not.toContain('local-owner');expect(transport).toHaveBeenCalledOnce()
    const reload=await(await request(query,undefined,cookie)).json();expect(reload.save.transcript).toHaveLength(1);expect(reload.save.state).toBeUndefined();expect(reload.budget.liveApproved).toBe(false)
    const weather=await request('/acceptance/turn',{scope,requestId:'weather',input:{...input,spoken:'Current weather in JHB?'}},cookie,session.csrf);expect((await weather.json()).redirected).toBe(true);expect(transport).toHaveBeenCalledOnce()
    const logout=await request('/tester/logout',{},cookie,session.csrf);expect(logout.headers.get('set-cookie')).toContain('Max-Age=0; Secure');expect((await request(query,undefined,cookie)).status).toBe(401)
    const fresh=await request('/tester/login',{username:'guest',password:'synthetic-guest-only'}),freshCookie=fresh.headers.get('set-cookie')!.split(';')[0]
    clock+=31*60000;expect((await request(query,undefined,freshCookie)).status).toBe(401)
    expect((await request('/')).headers.get('set-cookie')).toBeNull()
    const fixtureRoot=service.root,expiry=service.gate.leaseExpiresAt;await service.stop()
    service=await createGuestFixtureService({root:fixtureRoot,transport,now:()=>clock});await new Promise<void>(resolve=>service.server.listen(0,'127.0.0.1',resolve));internal=`http://127.0.0.1:${(service.server.address() as {port:number}).port}`
    expect((await request(query,undefined,freshCookie)).status).toBe(401)
    const restartedLogin=await request('/tester/login',{username:'guest',password:'synthetic-guest-only'}),restartedCookie=restartedLogin.headers.get('set-cookie')!.split(';')[0]
    const restored=await(await request(query,undefined,restartedCookie)).json();expect(restored.save.transcript).toHaveLength(1);expect(restored.budget.attemptsRemaining).toBe(19);expect(service.gate.leaseExpiresAt).toBe(expiry)
  }finally{await service.stop()}
})
it('never trusts an off-host peer or ambiguous forwarded/origin values',()=>{
  const req={socket:{remoteAddress:'127.0.0.1'},headers:{host:'127.0.0.1:1234','x-forwarded-proto':'https','x-forwarded-host':'guest.example.test',origin:guestOrigin}}
  expect(guestProxyContract(req,'127.0.0.1:1234')).toBe(guestOrigin)
  for(const headers of [{...req.headers,origin:'http://guest.example.test'},{...req.headers,forwarded:'proto=https'},{...req.headers,'x-forwarded-host':'guest.example.test, other.invalid'}])expect(()=>guestProxyContract({...req,headers},'127.0.0.1:1234')).toThrow()
  expect(()=>guestProxyContract({...req,socket:{remoteAddress:'192.0.2.2'}},'127.0.0.1:1234')).toThrow()
})
it('bounds 20 total fixture attempts across restart, preserves time, and refuses expired or held ledgers',async()=>{
  let now=Date.parse('2026-11-17T21:30:00Z');const path=root();let gate=new GuestFixtureGate(path,{now:()=>now});const deadline=gate.leaseExpiresAt
  try{
    const work=vi.fn(async({save})=>({save,reply:'[MOCK]',usage:{inputUnits:100,outputUnits:30}}))
    for(let n=0;n<20;n++){now+=61000;if(n===8){await gate.close();gate=new GuestFixtureGate(path,{now:()=>now});expect(gate.leaseExpiresAt).toBe(deadline)}await gate.execute(scope,`guest-${n}`,input,work,ctx)}
    await expect(gate.execute(scope,'twenty-one',input,work,ctx)).rejects.toThrow();expect(work).toHaveBeenCalledTimes(20);expect(gate.summary()).toMatchObject({attemptsRemaining:0,liveApproved:false,fixtureOnly:true,capMicros:250000,headroomMicros:25000})
    expect(JSON.parse(readFileSync(join(path,'guest-fixture-window.json'),'utf8')).expiresAt).toBe(deadline)
  }finally{await gate.close()}
  now=deadline+1;expect(()=>new GuestFixtureGate(path,{now:()=>now})).toThrow('expired')
  now=Date.parse('2026-11-17T21:30:00Z');const other=root(),held=new GuestFixtureGate(other,{now:()=>now})
  await expect(held.execute(scope,'uncertain',input,async()=>{throw new Error('synthetic unknown')},ctx)).rejects.toThrow();await held.close()
  const resumed=new GuestFixtureGate(other,{now:()=>now});try{expect(resumed.summary().heldMicros).toBe(7680);await expect(resumed.execute(scope,'no-retry',input,vi.fn(),ctx)).rejects.toThrow('ambiguous_attempt')}finally{await resumed.close()}
  expect(proposedGuestPlan.approved).toBe(false)
})
it('reserves atomically, fails at the synthetic cap, and closes its owned fixture server automatically',async()=>{
  const gate=new GuestFixtureGate(root());let release!:()=>void
  const work=vi.fn(async({save})=>{await new Promise<void>(resolve=>{release=resolve});return{save,reply:'[MOCK]',usage:{inputUnits:100,outputUnits:30}}})
  try{const first=gate.execute(scope,'one',input,work,ctx);await vi.waitFor(()=>expect(work).toHaveBeenCalledOnce());await expect(gate.execute(scope,'two',input,work,ctx)).rejects.toThrow('one_global');release();await first;gate.data.spentMicros=225000;gate.persist();await expect(gate.execute(scope,'cap',input,work,ctx)).rejects.toThrow('budget_exhausted');expect(work).toHaveBeenCalledOnce()}finally{await gate.close()}
  const service=await createGuestFixtureService({shutdownAfterMs:100});await new Promise<void>(resolve=>service.server.listen(0,'127.0.0.1',resolve));await vi.waitFor(()=>expect(service.server.listening).toBe(false));await vi.waitFor(()=>expect(service.gate.closed).toBe(true));await service.stop()
})
