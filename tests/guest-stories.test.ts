// @vitest-environment node
import {it,expect,vi} from 'vitest'
import {createGuestFixtureService} from '../scripts/tester/guestFixture.mjs'
import {buildGuestBody,buildGuestMemoryView} from '../scripts/tester/guestMemoryView.mjs'
import {appendMemoryLabel} from '../src/experimental/memoryLabels'
import {storyPresentation} from '../scripts/tester/storyPresentation.mjs'
it('keeps A/B stories, notes, corrections, auth expiry and exact provider packets isolated; resume dispatches nothing',async()=>{
 let now=Date.parse('2026-11-18T06:00:00Z');const bodies:string[]=[]
 const transport=vi.fn(async packet=>{bodies.push(JSON.stringify(buildGuestBody(packet)));return{text:'Seraphina lifts the lantern. "[MOCK] We can continue."',usage:{inputUnits:100,outputUnits:30}}})
 const app=await createGuestFixtureService({localOnly:true,transport,now:()=>now})
 try{
  await new Promise<void>(resolve=>app.server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${(app.server.address() as {port:number}).port}`
  let cookie='',csrf='';const request=(path:string,body?:object)=>fetch(origin+'/velvetverse'+path,{method:body?'POST':'GET',headers:{...(body?{Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined})
  const login=async()=>{const r=await request('/tester/login',{username:'guest',password:'synthetic-guest-only'});expect(r.status).toBe(200);cookie=r.headers.get('set-cookie')!.split(';')[0];csrf=(await r.json()).csrf}
  const a={testerId:'fixture-guest',storyId:'story-one',characterId:1}
  const label=async(scope:typeof a,action:string,factId:string,value:string)=>{const r=await request('/acceptance/label',{scope,action,factId,value,provenance:'observed',visibility:'provider-shared',witnessed:true});expect(r.status).toBe(200);return r.json()}
  const resume=async(scope:typeof a)=>{const r=await request('/acceptance/resume?'+new URLSearchParams({...scope,characterId:'1'}));expect(r.status).toBe(200);return r.json()}
  const turn=async(scope:typeof a,id:string)=>{now+=61000;const r=await request('/acceptance/turn',{scope,requestId:id,input:{spoken:'Which crossing should we take?',visibleAction:'',privateThought:'STORY_PRIVATE_THOUGHT',shareObserved:true}});expect(r.status).toBe(200);const result=await r.json();expect(result.engineReceipt.finalDispatches).toBe(1);expect(result.capture).toBe(bodies.at(-1));return result}
  await login();await label(a,'add','alias','Copper');await label(a,'add','promise','We will return the paper boat at dawn.');await label(a,'add','fact-route','A rockslide closed the bridge.')
  await app.gate.updateSave(a,save=>({...save,state:{'velvetverse-memory-1':JSON.stringify({userName:'PRIVATE_LEGACY_ALIAS',likes:['PRIVATE_LEGACY_FACT'],experiences:[]})},labels:appendMemoryLabel(save.labels,{version:1,id:'private-event',sequence:4,origin:{eventId:'private-origin',turnId:'private-turn'},characterId:1,storyScopeId:'story-one',conversationId:'session-1',factId:'fact-secret',provenance:'observed',visibility:'private',observedBy:[1],status:'active',supersedesId:null,summary:'PRIVATE_GUILD_REASON'})}))
  const first=await turn(a,'a-one');expect(bodies[0]).toContain('Copper');expect(first.progress.save.transcript).toHaveLength(1)
  const before=transport.mock.calls.length;const summary=await resume(a)
  expect(summary.save.returnSummary.lines).toContain('We will return the paper boat at dawn.');expect(summary.save.storyNotes.map(n=>n.key)).not.toContain('fact-secret');expect(transport).toHaveBeenCalledTimes(before)
  const created=await request('/acceptance/new-story',{scope:a});expect(created.status).toBe(200);const fresh=await created.json(),b={...a,storyId:fresh.storyId}
  expect(b.storyId).not.toBe(a.storyId);expect(fresh.progress.alias).toBeNull();expect(fresh.progress.save.transcript).toEqual([]);expect(fresh.progress.save.storyNotes).toEqual([]);expect(app.gate.getSave(b).state).toEqual({});expect(app.gate.getSave(a).transcript).toHaveLength(1)
  await label(b,'add','alias','Ash');await label(b,'add','fact-route','The ferry is open.');await turn(b,'b-one');expect(bodies[1]).toContain('Ash');expect(bodies[1]).not.toContain('Copper');expect(bodies[1]).not.toContain('rockslide');expect(bodies[1]).not.toContain('paper boat')
  await label(a,'correct','alias','Lark');await label(a,'revoke','promise','');await turn(a,'a-two');expect(bodies[2]).toContain('Lark');expect(bodies[2]).not.toContain('Copper');expect(bodies[2]).not.toContain('Ash');expect(bodies[2]).not.toContain('paper boat')
  now+=31*60000;const expired=await request('/acceptance/resume?testerId=fixture-guest&storyId=story-one&characterId=1');expect(expired.status).toBe(401);expect(await expired.text()).not.toContain('Lark')
  await login();const dispatches=transport.mock.calls.length,entries=Object.keys(app.gate.data.entries).length
  const returnedA=await resume(a),returnedB=await resume(b);expect(returnedA.alias).toBe('Lark');expect(returnedB.alias).toBe('Ash');expect(returnedA.save.transcript).toHaveLength(2);expect(returnedB.save.transcript).toHaveLength(1)
  expect(JSON.stringify(returnedA.save.storyNotes)).not.toMatch(/Copper|Ash|paper boat|PRIVATE_/);expect(returnedB.save.storyNotes.map(n=>n.value)).toContain('The ferry is open.')
  expect(transport).toHaveBeenCalledTimes(dispatches);expect(Object.keys(app.gate.data.entries)).toHaveLength(entries)
  const listing=await(await request('/acceptance/stories?characterId=1')).json();expect(listing.stories.map(s=>s.id).sort()).toEqual([a.storyId,b.storyId].sort())
  expect((await request('/acceptance/resume?testerId=another&storyId='+b.storyId+'&characterId=1')).status).toBe(403)
  expect((await request('/acceptance/resume?testerId=fixture-guest&storyId=not-owned&characterId=1')).status).toBe(404)
  expect((await request('/acceptance/new-story',{scope:{...a,testerId:'another'}})).status).toBe(403)
  for(const body of bodies)expect(body).not.toMatch(/STORY_PRIVATE_THOUGHT|PRIVATE_LEGACY|PRIVATE_GUILD_REASON/)
  expect(transport).toHaveBeenCalledTimes(3)
 }finally{await app.stop()}
},15000)
it('durably owns an empty new story before any turn, restores A after restart/idle expiry, and atomically admits only the eighth save',async()=>{
 let now=Date.parse('2026-11-18T06:00:00Z');const transport=vi.fn(),options={localOnly:true,transport,now:()=>now}
 let app=await createGuestFixtureService(options);const root=app.root,deadline=app.gate.leaseExpiresAt
 let origin='',cookie='',csrf='';const listen=async()=>{await new Promise<void>(resolve=>app.server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${(app.server.address() as {port:number}).port}`}
 const request=(path:string,body?:object)=>fetch(origin+'/velvetverse'+path,{method:body?'POST':'GET',headers:{...(body?{Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined})
 const login=async()=>{const r=await request('/tester/login',{username:'guest',password:'synthetic-guest-only'});cookie=r.headers.get('set-cookie')!.split(';')[0];csrf=(await r.json()).csrf}
 const a={testerId:'fixture-guest',storyId:'story-one',characterId:1}
 try{
  await listen();await login();await app.gate.updateSave(a,save=>({...save,transcript:[]}))
  const result=await(await request('/acceptance/new-story',{scope:a})).json(),emptyId=result.storyId
  expect(Object.keys(app.gate.data.saves)).toHaveLength(2);expect(app.gate.getSave({...a,storyId:emptyId}).transcript).toEqual([])
  await app.stop();now+=16*60000;app=await createGuestFixtureService({...options,root});await listen()
  expect((await request('/acceptance/stories?characterId=1')).status).toBe(401);await login()
  const list=await(await request('/acceptance/stories?characterId=1')).json();expect(list.stories.map(s=>s.id)).toContain(emptyId)
  expect((await(await request('/acceptance/resume?testerId=fixture-guest&storyId='+emptyId+'&characterId=1')).json()).save.transcript).toEqual([])
  expect((await request('/acceptance/resume?testerId=fixture-guest&storyId=story-one&characterId=1')).status).toBe(200)
  for(let n=0;n<5;n++)expect((await request('/acceptance/new-story',{scope:a})).status).toBe(200)
  expect(Object.keys(app.gate.data.saves)).toHaveLength(7)
  const final=await Promise.all([request('/acceptance/new-story',{scope:a}),request('/acceptance/new-story',{scope:a})]);expect(final.map(r=>r.status).sort()).toEqual([200,429]);expect(Object.keys(app.gate.data.saves)).toHaveLength(8)
  expect(app.gate.leaseExpiresAt).toBe(deadline);expect(app.gate.summary().attemptsRemaining).toBe(20);expect(Object.keys(app.gate.data.entries)).toHaveLength(0);expect(transport).not.toHaveBeenCalled()
 }finally{await app.stop()}
},10000)
it('does not inherit the authored original-story boundary or any notes into a fresh story',()=>{
 const save={labels:{version:1,events:[]}},input={spoken:'Continue the fictional scene.',visibleAction:''}
 expect(buildGuestMemoryView(save,{testerId:'guest',storyId:'story-one',characterId:1},input).packet.boundarySignals).toEqual(['guild-reasons-not-disclosable'])
 const next=buildGuestMemoryView(save,{testerId:'guest',storyId:'story-fresh',characterId:1},input).packet
 expect(next.boundarySignals).toEqual([]);expect(next.memories).toEqual([]);expect(next.recentDialogue).toEqual([]);expect(next.alias).toBeNull()
})
it('does not admit a same-local-ID note from another story into the recap or notes',()=>{
 const base={version:1,id:'same-local-id',sequence:1,origin:{eventId:'source',turnId:'turn'},characterId:1,storyScopeId:'story-one',conversationId:'session-1',factId:'fact-route',provenance:'observed',visibility:'provider-shared',observedBy:[1],status:'active',supersedesId:null,summary:'The bridge is closed.'}
 const labels={version:1,events:[base,{...base,sequence:2,storyScopeId:'another-story',summary:'OTHER_STORY_SAME_ID_CANARY'}]}
 const presentation=storyPresentation({labels,transcript:[]},{testerId:'guest',storyId:'story-one',characterId:1})
 expect(presentation.storyNotes).toEqual([{key:'fact-route',value:'The bridge is closed.'}]);expect(JSON.stringify(presentation)).not.toContain('OTHER_STORY')
})
