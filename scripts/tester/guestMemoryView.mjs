import {createHash} from 'node:crypto'
import {validateLabelLedger} from '../../src/experimental/memoryLabels.ts'
import {buildTesterBody} from './projection.mjs'
import {GateError} from '../acceptance/gate.mjs'
const bytes=value=>Buffer.byteLength(JSON.stringify(value))
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
const stop=new Set('a an the to of is are was were we us they them their for at in on with what which how why can could still now there this that from has have and only continue scene player seraphina do you i me my it be'.split(' '))
// General retrieval topics, NOT assertions that e.g. a ferry is a bridge.
// No fixture IDs, place names, secret values or expected answers occur here.
const topics=[
 ['passage','bridge','footbridge','crossing','cross','ford','ferry','causeway','overpass','walkway'],
 ['appointment','meeting','meet','rendezvous','appointment','gathering'],
 ['waterway','river','stream','brook','creek','riverbank','flood','swollen','rising'],
 ['access','key','lock','unlock','door','doorway','entrance','entry','latch'],
 ['commitment','promise','pledge','vow','agreement','agree','agreed'],
]
function words(text){return new Set((text.toLowerCase().match(/[a-z0-9]+/g)??[]).filter(word=>!stop.has(word)).map(word=>word.length>4&&word.endsWith('ies')?word.slice(0,-3)+'y':word.length>3&&word.endsWith('s')&&!word.endsWith('ss')&&!word.endsWith('us')&&!word.endsWith('ous')?word.slice(0,-1):word))}
function concepts(tokens){return new Set(topics.filter(group=>group.some(word=>tokens.has(word))).map(group=>group[0]))}
export function guestRelevance(query,summary){
 const q=words(query),r=words(summary),qc=concepts(q),rc=concepts(r)
 return [...q].filter(word=>r.has(word)).length*3+[...qc].filter(topic=>rc.has(topic)).length
}
const eligible=event=>event.status==='active'&&event.provenance==='observed'&&event.visibility==='provider-shared'&&event.observedBy.includes(event.characterId)
const scopeKey=scope=>JSON.stringify([scope.testerId,scope.storyId,scope.characterId])
export const guestBoundaryPolicies=Object.freeze([Object.freeze({version:1,author:'operator',accountId:'guest',storyId:'story-one',characterId:1,code:'guild-reasons-not-disclosable'})])
function policyCodes(policies,scope){
 if(!Array.isArray(policies)||policies.length>8)throw new GateError('invalid_guest_boundary_policy',503)
 const result=[]
 for(const policy of policies){
  if(!policy||Object.keys(policy).sort().join()!=='accountId,author,characterId,code,storyId,version'||policy.version!==1||policy.author!=='operator'||policy.code!=='guild-reasons-not-disclosable')throw new GateError('invalid_guest_boundary_policy',503)
  if(policy.accountId===scope.testerId&&policy.storyId===scope.storyId&&policy.characterId===scope.characterId)result.push(policy.code)
 }
 return [...new Set(result)].sort()
}
export function buildGuestMemoryView(save,scope,input,{policies=guestBoundaryPolicies}={}){
 if(!scope||!/^[-a-z0-9]{1,32}$/.test(scope.testerId??'')||!/^[-a-z0-9]{1,40}$/.test(scope.storyId??'')||scope.characterId!==1||!input||!['spoken','visibleAction'].every(key=>typeof input[key]==='string'&&input[key].length<=2000))throw new GateError('explicit_guest_view_scope_required',400)
 const ledger=validateLabelLedger(save.labels),latest=new Map()
 for(const event of ledger.events)if(event.characterId===scope.characterId&&event.storyScopeId===scope.storyId)latest.set(event.factId,event)
 const current=[...latest.values()],permitted=current.filter(eligible)
 const revision=hash({scope:scopeKey(scope),events:current,policies:policyCodes(policies,scope)})
 const aliasEvent=latest.get('alias'),alias=aliasEvent&&eligible(aliasEvent)&&/^[A-Za-z][A-Za-z -]{0,39}$/.test(aliasEvent.summary)?aliasEvent.summary:null
 const query=input.spoken+' '+input.visibleAction,selected=[],seen=new Set()
 const ranked=permitted.filter(event=>event.factId!=='alias').map(event=>({event,score:guestRelevance(query,event.summary)}))
  .filter(item=>item.score>0).sort((a,b)=>b.score-a.score||b.event.sequence-a.event.sequence||a.event.id.localeCompare(b.event.id))
 for(const {event} of ranked){const normalized=event.summary.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();if(seen.has(normalized))continue;seen.add(normalized)
  const record={id:event.id,summary:event.summary};if(selected.length<3&&bytes([...selected,record])<=600)selected.push(record)
 }
 const recent=[]
 for(const event of (Array.isArray(save.guestDialogueEvents)?save.guestDialogueEvents:[]).slice(-12).reverse()){
  if(!event||Object.keys(event).sort().join()!=='accountId,characterId,id,origin,reply,revision,spoken,storyId,version,visibleAction'||event.version!==2||event.origin!=='guest-approved-view'||!/^[-a-zA-Z0-9_]{1,80}$/.test(event.id??'')||event.revision!==revision||event.accountId!==scope.testerId||event.storyId!==scope.storyId||event.characterId!==scope.characterId||!['spoken','visibleAction','reply'].every(key=>typeof event[key]==='string'&&event[key].length<=2000))continue
  const quote={spoken:event.spoken,visibleAction:event.visibleAction,reply:event.reply}
  if(recent.length<4&&bytes([...recent,quote])<=1800)recent.push(quote)
 }
 const packet={mode:'acceptance-fake-only',characterId:scope.characterId,storyScopeId:scope.storyId,alias,observedSpoken:input.spoken,observedAction:input.visibleAction,memories:selected,recentDialogue:recent.reverse(),memoryViewVersion:1,boundarySignals:policyCodes(policies,scope)}
 // No legacy scalar, experience, summary, transcript or v1 dialogue object is
 // read into the provider projection. This immutable snapshot is the authority.
 return freeze({version:1,revision,scope:scopeKey(scope),eligibleIds:permitted.map(event=>event.id),packet})
}
export function guestCorePacket(view){const p=view.packet;return{mode:p.mode,characterId:p.characterId,storyScopeId:p.storyScopeId,alias:p.alias,observedSpoken:p.observedSpoken,observedAction:p.observedAction,memories:p.memories}}
export function buildGuestBody(packet){
 if(!packet||Object.keys(packet).sort().join()!=='alias,boundarySignals,characterId,memories,memoryViewVersion,mode,observedAction,observedSpoken,recentDialogue,storyScopeId'||packet.memoryViewVersion!==1||!Array.isArray(packet.boundarySignals)||packet.boundarySignals.length>1||packet.boundarySignals.some(code=>code!=='guild-reasons-not-disclosable'))throw Object.assign(new GateError('invalid_guest_memory_view',400),{knownNoDispatch:true})
 const boundarySignals=packet.boundarySignals,core={...packet};delete core.memoryViewVersion;delete core.boundarySignals
 const body=buildTesterBody(core)
 if(boundarySignals.length)body.input[0].content+=' Authored nondisclosure constraint: do not disclose or invent private guild-departure reasons. This does not assert a departure occurred. No underlying reason is supplied or permitted.'
 if(bytes(body)>8192)throw Object.assign(new GateError('guest_packet_too_large',413),{knownNoDispatch:true})
 return body
}
export function captureGuestDialogue(save,scope,input,requestId,providerReply,view){
 const event={version:2,origin:'guest-approved-view',accountId:scope.testerId,storyId:scope.storyId,characterId:scope.characterId,id:requestId,revision:view.revision,spoken:input.spoken,visibleAction:input.visibleAction,reply:typeof providerReply==='string'?providerReply:''}
 const transcript=save.transcript.map((turn,index)=>index===save.transcript.length-1?{...turn,guestRecordVersion:1,guestScope:scopeKey(scope),guestRequestId:requestId}:turn)
 return{...save,transcript,guestDialogueEvents:[...(Array.isArray(save.guestDialogueEvents)?save.guestDialogueEvents:[]),event].slice(-12)}
}
export function guestVisibleTranscript(save,scope){return save.transcript.filter(turn=>turn.guestRecordVersion===1&&turn.guestScope===scopeKey(scope)&&/^[-a-zA-Z0-9_]{1,80}$/.test(turn.guestRequestId??'')).map(turn=>({spoken:turn.spoken,visibleAction:turn.visibleAction,reply:turn.reply}))}
