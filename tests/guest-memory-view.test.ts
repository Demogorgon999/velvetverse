// @vitest-environment node
import {it,expect} from 'vitest'
import {buildGuestMemoryView,buildGuestBody,captureGuestDialogue,guestRelevance} from '../scripts/tester/guestMemoryView.mjs'
import {cases as planCases,forbidden} from '../scripts/memory-evaluation/fixtures.mjs'
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
