// @vitest-environment node
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {it,expect,vi,beforeEach} from 'vitest'
import {buildGuestMemoryView,buildGuestBody,guestCorePacket,captureGuestDialogue,guestRelevance} from '../scripts/tester/guestMemoryView.mjs'
import {createGuestLiveService} from '../scripts/tester/guestLiveService.mjs'
import {createSmokeResponsesTransport} from '../scripts/acceptance/responsesTransport.mjs'
import {smokePolicy} from '../scripts/acceptance/livePolicy.mjs'
import {runIsolatedRoleplay} from '../scripts/acceptance/orchestration.mjs'
import {cases as planCases,forbidden} from '../scripts/memory-evaluation/fixtures.mjs'
beforeEach(()=>{vi.spyOn(Date,'now').mockReturnValue(Date.parse('2026-11-18T06:00:00Z'))})
const scope={testerId:'guest',storyId:'story-one',characterId:1}
const input=(spoken:string)=>({spoken,visibleAction:'',privateThought:'AMBER LARK',shareObserved:true})
type Patch=Record<string,unknown>
function labels(patches:Patch[]){const prior=new Map<string,string>();return{version:1,events:patches.map((patch,index)=>{
 const characterId=Number(patch.characterId??1),storyScopeId=String(patch.storyScopeId??'story-one'),factId=String(patch.factId??'fact-'+index),id=String(patch.id??'event-'+(index+1)),key=JSON.stringify([characterId,storyScopeId,factId])
 const event={version:1,id,sequence:index+1,origin:{eventId:'source-'+index,turnId:'turn-'+index},characterId,storyScopeId,conversationId:'session-1',factId,provenance:'observed',visibility:'provider-shared',observedBy:[characterId],status:'active',summary:'A permitted fictional fact.',supersedesId:prior.get(key)??null,...patch};prior.set(key,id);return event
})}}
const save=(patches:Patch[])=>({conversation:1,labels:labels(patches),state:{'velvetverse-memory-1':JSON.stringify({userName:'LEGACY_COPPER',likes:['AMBER LARK'],dislikes:[],importantFacts:['PRIVATE_SEALED_REASON'],experiences:[{summary:'OFFSCREEN_QUARTZ',importance:100,emotionalWeight:100}],relationshipScore:0,updatedAt:'2026-11-18T00:00:00Z'})},transcript:[{spoken:'AMBER LARK',visibleAction:'',privateThought:'PRIVATE_SEALED_REASON',reply:'OFFSCREEN_QUARTZ'}],dialogueEvents:[{version:1,origin:'server-observed-turn',reply:'PRIVATE_SEALED_REASON',spoken:'AMBER LARK'}]})
it('passes all eight plan scenarios on the actual guest body builder, including the original crossing wording',()=>{
 const turns=['Which crossing should we take?','Where are we meeting?','Remember when we rescued Captain Venn together?','Any thoughts about the lock?','What do you usually call me?','Tell me exactly why you left.','The river is rising again.','What was it Vale handed us for getting inside?']
 const expected=[['bridge-closed'],['meeting-new'],[],[],[],['guild-public'],['paper-boat'],['key-paraphrase-b']]
 for(const [index,testCase] of planCases.entries()){
  const patches=testCase.records.map(record=>({id:record.id,characterId:record.characterId,storyScopeId:record.chatId==='chat-main'?'story-one':record.chatId,factId:record.factKey,summary:record.id==='bridge-closed'?'A rockslide closed the old bridge.':record.id==='meeting-new'?'The meeting is now at the mill.':record.summary,provenance:record.source,visibility:record.visibility==='shared'?'provider-shared':record.visibility,observedBy:record.perceivedBy}))
  const view=buildGuestMemoryView(save(patches),scope,input(turns[index])),wire=JSON.stringify(buildGuestBody(view.packet))
  expect(view.packet.memories.map(record=>record.id),testCase.id).toEqual(expected[index])
  for(const marker of [...forbidden,'LEGACY_COPPER','PRIVATE_SEALED_REASON','OFFSCREEN_QUARTZ'])expect(wire,testCase.id).not.toContain(marker)
  expect(wire).not.toContain('North Gate')
  if(testCase.id==='unverified-rescue'){expect(view.packet.memories).toEqual([]);expect(wire).toContain('Captain Venn')}
 }
})
it('ranks the old closed bridge across crossing terminology without pretruncating to the 16 newest labels and freezes the full view',()=>{
 const source=save([{id:'old-bridge',factId:'fact-route',summary:'A rockslide closed the old bridge.'},...Array.from({length:25},(_,i)=>({factId:'fact-noise-'+i,summary:i%2?'They made tea.':'They polished a lantern.'})),{factId:'private',summary:'AMBER LARK',visibility:'private'},{factId:'other',storyScopeId:'isolated',summary:'Copper is the nickname.'}])
 const view=buildGuestMemoryView(source,scope,input('Which crossing should we take?'))
 expect(view.packet.memories.map(record=>record.id)).toEqual(['old-bridge']);expect(Object.isFrozen(view.packet.memories[0])).toBe(true)
 expect(()=>view.packet.memories.push({id:'x',summary:'PRIVATE_SEALED_REASON'})).toThrow()
 source.labels.events[0].summary='MUTATED_AFTER_SNAPSHOT';const wire=JSON.stringify(buildGuestBody(view.packet))
 for(const marker of ['AMBER LARK','Copper','LEGACY_COPPER','PRIVATE_SEALED_REASON','OFFSCREEN_QUARTZ','MUTATED_AFTER_SNAPSHOT'])expect(wire).not.toContain(marker)
 expect(wire).toContain('A rockslide closed the old bridge.');expect(wire).toContain('do not disclose or invent private guild-departure reasons')
})
it('passes fresh held-out terminology pairs and rejects unrelated tea for passage relevance',()=>{
 const pairs=[['Flooding made the ferry unusable.','Is this crossing available?'],['We will rendezvous at the granary.','Where is our meeting?'],['A brass key operates the old lock.','How do we get through that doorway?'],['They agreed to return the borrowed cloak.','What promise did I make?'],['The creek is swollen after rain.','Will the river be safe?']]
 for(const [summary,query] of pairs){const view=buildGuestMemoryView(save([{id:'target',summary},{id:'noise',summary:'They brewed tea by a lantern.'}]),scope,input(query));expect(view.packet.memories.map(record=>record.id)).toEqual(['target'])}
 expect(guestRelevance('Which crossing?','They brewed tea.')).toBe(0)
})
it('uses latest correction, private revision and revocation before ranking; aliases and prior dialogue cannot resurrect stale values',()=>{
 const source=save([{factId:'meeting',summary:'Meet at North Gate.'},{id:'current',factId:'meeting',summary:'The meeting moved to the mill.'},{factId:'alias',summary:'Dove'}])
 const first=buildGuestMemoryView(source,scope,input('Where do we rendezvous?'));expect(first.packet.memories.map(record=>record.id)).toEqual(['current']);expect(first.packet.alias).toBe('Dove')
 const withHistory=captureGuestDialogue(source,scope,input('Where do we rendezvous?'),'old','The plan is North Gate and Dove.',first)
 withHistory.labels=labels([...source.labels.events.map(event=>({id:event.id,factId:event.factId,summary:event.summary})),{factId:'meeting',summary:'PRIVATE_SEALED_REASON',visibility:'private'},{factId:'alias',status:'revoked',summary:''}])
 const next=buildGuestMemoryView(JSON.parse(JSON.stringify(withHistory)),scope,input('Where is the meeting?'))
 expect(next.packet.alias).toBeNull();expect(next.packet.memories).toEqual([]);expect(next.packet.recentDialogue).toEqual([])
 const wire=JSON.stringify(buildGuestBody(next.packet));for(const value of ['North Gate','mill','Dove','PRIVATE_SEALED_REASON'])expect(wire).not.toContain(value)
})
it('fails closed for malformed metadata/boundary packets and ignores unknown or wrong scope records',()=>{
 expect(()=>buildGuestMemoryView({...save([]),labels:{version:1,events:[{summary:'unknown'}]}},scope,input('bridge'))).toThrow()
 const view=buildGuestMemoryView(save([{summary:'PRIVATE_SEALED_REASON',provenance:'unknown'},{summary:'AMBER LARK',visibility:'offscreen'},{summary:'OTHER_CHARACTER',characterId:2},{summary:'OTHER_SAVE',storyScopeId:'elsewhere'}]),scope,input('bridge'))
 expect(view.packet.memories).toEqual([])
 expect(()=>buildGuestBody({...view.packet,legacySummary:'PRIVATE_SEALED_REASON'})).toThrow()
 expect(()=>buildGuestBody({...view.packet,boundarySignals:['PRIVATE_SEALED_REASON']})).toThrow()
 expect(()=>buildGuestMemoryView(save([]),scope,input('guild'),{policies:[{version:1,author:'operator',accountId:'guest',storyId:'story-one',characterId:1,code:'guild-reasons-not-disclosable',reason:'PRIVATE_SEALED_REASON'}]})).toThrow()
})
it('routes the actual authenticated live guest HTTP -> worker -> exact Responses adapter wire through the new snapshot, including corrections/reload/alias revocation',async()=>{
 let clock=Date.now();const wire:string[]=[]
 const providerFetch=vi.fn(async(endpoint:string,options:{body:string})=>{
  expect(endpoint).toBe('https://api.openai.com/v1/responses');wire.push(options.body)
  return new Response(JSON.stringify({model:smokePolicy.model,service_tier:'default',status:'completed',usage:{input_tokens:100,output_tokens:30},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:wire.length===1?'Seraphina checks the map. "[MOCK] The bridge is closed by a rockslide."':'Seraphina checks the map. "[MOCK] Let us consider the current scene."'}]}]}))
 })
 const adapter=createSmokeResponsesTransport({key:'synthetic-test-value-not-a-credential',approved:true,maxAttempts:20,buildBody:buildGuestBody,fetchImpl:providerFetch})
 const root=mkdtempSync(join(tmpdir(),'vv-guest-view-wire-')),password='synthetic-guest-memory-test-only'
 let service=await createGuestLiveService({root,password,transport:async(packet,signal)=>{expect(Object.isFrozen(packet)).toBe(true);return adapter(packet,signal)},now:()=>clock}),internal=''
 const listen=async()=>{await new Promise<void>(resolve=>service.server.listen(0,'127.0.0.1',resolve));internal=`http://127.0.0.1:${(service.server.address() as {port:number}).port}`}
 let cookie='',csrf=''
 const request=(path:string,body?:object)=>fetch(internal+'/velvetverse'+path,{method:body?'POST':'GET',headers:{'X-Forwarded-Proto':'https','X-Forwarded-Host':'guest.example.test',...(body?{Origin:'https://guest.example.test','Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined})
 const login=async()=>{const response=await request('/tester/login',{username:'guest',password});cookie=response.headers.get('set-cookie')!.split(';')[0];csrf=(await response.json()).csrf}
 const label=async(action:string,factId:string,value:string)=>{const response=await request('/acceptance/label',{scope,providerConsent:'openai-tester',action,factId,value,provenance:'observed',visibility:'provider-shared',witnessed:true});expect(response.status).toBe(200);return response.json()}
 const turn=async(id:string,spoken:string)=>{clock+=61000;const response=await request('/acceptance/turn',{scope,providerConsent:'openai-tester',requestId:id,input:input(spoken)});expect(response.status).toBe(200);const result=await response.json();expect(result.engineReceipt.guestMemoryViewVersion).toBe(1);if(result.engineReceipt.finalDispatches)expect(JSON.parse(result.capture)).toEqual(JSON.parse(wire.at(-1)!));return result}
 try{
  await service.gate.updateSave(scope,()=>save([{summary:'PRIVATE_SEALED_REASON',visibility:'character-only'},{summary:'Copper',storyScopeId:'elsewhere'}]));await listen();await login()
  await label('add','fact-route','A rockslide closed the old bridge.');const first=await turn('bridge','Which crossing should we take?')
  expect(first.engineReceipt.finalDispatches).toBe(1);expect(wire[0]).toContain('rockslide closed the old bridge')
  await label('correct','fact-route','The repaired bridge is now passable.');await turn('corrected','Is this crossing usable?')
  expect(wire[1]).toContain('repaired bridge');expect(wire[1]).not.toContain('closed by a rockslide');expect(wire[1]).not.toContain('rockslide closed the old bridge')
  await label('add','alias','Dove');await label('correct','alias','Lark')
  const fresh=await request('/acceptance/new-session',{scope});expect((await fresh.json()).alias).toBe('Lark')
  await turn('alias','How should we continue this scene?');expect(JSON.parse(JSON.parse(wire.at(-1)!).input[1].content).alias).toBe('Lark')
  await label('revoke','alias','');const expiry=service.gate.leaseExpiresAt;await service.stop()
  service=await createGuestLiveService({root,password,transport:adapter,now:()=>clock});await listen();await login();expect(service.gate.leaseExpiresAt).toBe(expiry)
  const status=await(await request('/acceptance/status?testerId=guest&storyId=story-one&characterId=1')).json();expect(status.alias).toBeNull();expect(status.save.labels).toBeUndefined()
  await turn('revoked','How should we continue this scene?');expect(JSON.parse(JSON.parse(wire.at(-1)!).input[1].content).alias).toBeNull();expect(wire.at(-1)).not.toContain('Lark')
  const local=await turn('local-name','Do you remember my name?');expect(local.engineReceipt.scopedLocalReply).toBe(true);expect(local.reply).toContain('traveler');expect(local.reply).not.toContain('LEGACY_COPPER')
  for(const body of wire){for(const marker of ['AMBER LARK','PRIVATE_SEALED_REASON','OFFSCREEN_QUARTZ','LEGACY_COPPER','Copper'])expect(body).not.toContain(marker);expect(JSON.parse(body)).toMatchObject({model:smokePolicy.model,store:false,stream:false,max_output_tokens:256});expect(JSON.parse(body)).not.toHaveProperty('tools')}
  expect(providerFetch).toHaveBeenCalledTimes(4)
 }finally{await service.stop()}
},30000)
it('preserves original engine state effects while guarding a legacy local memory reply for the guest',async()=>{
 const source=save([]),turnInput=input('Do you remember my name?'),policy={maxInputBytes:8192,maxOutputBytes:2048},signal=()=>new AbortController().signal
 const ordinary=await runIsolatedRoleplay({scope,input:turnInput,save:structuredClone(source),signal:signal()},policy)
 const view=buildGuestMemoryView(source,scope,turnInput)
 const guest=await runIsolatedRoleplay({scope,input:turnInput,save:structuredClone(source),signal:signal(),guestMemoryCore:guestCorePacket(view)},policy)
 expect(ordinary.reply).toContain('LEGACY_COPPER');expect(guest.reply).not.toContain('LEGACY_COPPER');expect(guest.engineReceipt.finalDispatches).toBe(0)
 const normalize=(value:unknown):unknown=>Array.isArray(value)?value.map(normalize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!['updatedAt','lastSeen','lastSimulatedAt','lastInteractionAt','lastInteraction','createdAt','id'].includes(key)).map(([key,child])=>[key,normalize(child)])):value
 expect(Object.keys(guest.save.state).sort()).toEqual(Object.keys(ordinary.save.state).sort())
 for(const key of Object.keys(ordinary.save.state))expect(normalize(JSON.parse(guest.save.state[key]))).toEqual(normalize(JSON.parse(ordinary.save.state[key])))
},20000)
