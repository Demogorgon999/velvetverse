import { PersistentMockGate, GateError } from '../acceptance/gate.mjs'
import {existsSync,readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import { smokePolicy } from '../acceptance/livePolicy.mjs'
export function testerPolicy({ mode = 'fake', capMicros = 1000000, creditCeilingMicros = 24000000, expiresAt = '2026-11-24T23:00:00Z', testerIds = ['fixture-a','fixture-b'] } = {}) {
  if (!['fake','live'].includes(mode) || !Number.isSafeInteger(capMicros) || capMicros < 20000 || capMicros > 1000000 ||
    !Number.isSafeInteger(creditCeilingMicros) || creditCeilingMicros > 25000000 || capMicros > creditCeilingMicros / 2 ||
    !Number.isFinite(Date.parse(expiresAt)) || mode==='live'&&Date.parse(expiresAt) > Date.parse('2026-11-25T00:00:00Z') ||
    !Array.isArray(testerIds) || !testerIds.length || testerIds.length > 2 || !testerIds.every(id => /^[a-z0-9-]{1,32}$/.test(id))) throw new GateError('invalid_tester_policy',503)
  return { provider: mode === 'live' ? 'openai-tester' : 'tester-fake', mode, capMicros, creditCeilingMicros, headroomMicros: Math.max(10000,Math.ceil(capMicros/10)), expiresAt:new Date(expiresAt).toISOString(), testerIds,
    maxInputBytes:8192,maxOutputBytes:2048,timeoutMs:25000,maxAttempts:100 }
}
export class TesterGate extends PersistentMockGate {
  constructor(path, policy, { now = () => Date.now(), leaseExpiresAt = now()+2*3600000 } = {}) {
    if(!Number.isFinite(leaseExpiresAt)||leaseExpiresAt<=now()||leaseExpiresAt>now()+2*3600000)throw new GateError('invalid_demo_lease',503)
    super(path,policy,{now,validatePolicy:value=>{
      const expected=testerPolicy({mode:value.mode,capMicros:value.capMicros,creditCeilingMicros:value.creditCeilingMicros,expiresAt:value.expiresAt,testerIds:value.testerIds})
      if(JSON.stringify(value)!==JSON.stringify(expected))throw new GateError('invalid_tester_policy',503)
      return expected
    }})
    this.leaseExpiresAt=Math.min(leaseExpiresAt,now()+2*3600000,Date.parse(policy.expiresAt))
  }
  active(){super.active();if(this.now()>=this.leaseExpiresAt)throw new GateError('demo_lease_expired',403)}
  validateScope(scope){super.validateScope(scope);if(scope.characterId!==1)throw new GateError('seraphina_only',400)}
  checkStoryBound(scope){if(!this.data.saves[JSON.stringify([scope.testerId,scope.storyId,scope.characterId])]&&Object.keys(this.data.saves).filter(key=>JSON.parse(key)[0]===scope.testerId).length>=8)throw new GateError('eight_stories_per_account',429)}
  updateSave(scope,mutate){return super.updateSave(scope,save=>{this.checkStoryBound(scope);const next=mutate(save);if(next.labels.events.length>64||Buffer.byteLength(JSON.stringify(next))>524288)throw new GateError('tester_save_bound',413);return next})}
  reservationMicros(){return 7680}
  validUsage(value){return value&&Number.isSafeInteger(value.inputUnits)&&value.inputUnits>=0&&value.inputUnits<=8704&&Number.isSafeInteger(value.outputUnits)&&value.outputUnits>=0&&value.outputUnits<=256}
  chargeUsage(value){return Math.ceil(value.inputUnits*0.75+value.outputUnits*4.5)}
  checkAttemptLimit(context,scope){
    this.checkStoryBound(scope)
    const entries=Object.values(this.data.entries)
    if(!/^[a-f0-9]{32}$/.test(context?.sessionTag??''))throw new GateError('trusted_session_required',403)
    if(entries.some(e=>e.status==='held'))throw new GateError('ambiguous_attempt_requires_review',409)
    if(entries.some(e=>e.status==='reserved'))throw new GateError('one_global_turn_at_a_time',409)
    const own=entries.filter(e=>JSON.parse(e.scopeKey)[0]===scope.testerId)
    if(entries.length>=100||own.length>=80||entries.filter(e=>e.sessionTag===context.sessionTag).length>=20)throw new GateError('tester_attempt_limit',429)
    if(own.filter(e=>this.now()-e.createdAt<60000).length>=3)throw new GateError('three_turns_per_minute',429)
  }
  recordMeasurement(entry,value){entry.measurement={status:entry.status,model:smokePolicy.model,latencyMs:Number.isSafeInteger(value?.latencyMs)?value.latencyMs:null,inputTokens:entry.usage?.inputUnits??null,outputTokens:entry.usage?.outputUnits??null,costMicros:entry.chargeMicros??null}}
  summary(){return{...super.summary(),kind:this.policy.mode==='live'?'DEMO LIVE USD MICROS - NOT PLATFORM BALANCE':'MOCK DEMO - SYNTHETIC USAGE, ZERO MODEL TRAFFIC',providerMode:this.policy.provider,
    attemptsRemaining:Math.max(0,(this.policy.testerIds.length===1?80:100)-Object.keys(this.data.entries).length),expired:this.now()>=Math.min(this.leaseExpiresAt??Infinity,Date.parse(this.policy.expiresAt)),model:smokePolicy.model}}
}
export function validateLiveTesterApproval(config,now=Date.now()){
  if(!config||Object.keys(config).some(key=>!['approvedFor','noPaidBilling','proxyEnabled','origin','verifiedAt','remainingPromoUsd','promoExpiresAt','capMicros','accounts'].includes(key))||config.approvedFor!=='multi-turn-local-tester'||config.noPaidBilling!==true||config.proxyEnabled!==false||config.origin!=='http://127.0.0.1:5190'||
    !Number.isFinite(Date.parse(config.verifiedAt))||now-Date.parse(config.verifiedAt)>4*3600000||Date.parse(config.verifiedAt)>now||
    !Number.isFinite(config.remainingPromoUsd)||config.remainingPromoUsd<=0||!Number.isFinite(Date.parse(config.promoExpiresAt))||Date.parse(config.promoExpiresAt)<=now+2*3600000||
    !Array.isArray(config.accounts)||config.accounts.length!==1||String(config.accounts[0]?.id).startsWith('fixture-'))throw new GateError('live_tester_setup_not_approved',403)
  if(config.capMicros>Math.min(25000000,Math.floor(config.remainingPromoUsd*1000000))/2)throw new GateError('live_tester_setup_not_approved',403)
  // Stable allocation ceiling, not the changing account balance. Each boot
  // independently verifies cap <= half the freshly attested remaining promo.
  return testerPolicy({mode:'live',capMicros:config.capMicros,creditCeilingMicros:config.capMicros*2,expiresAt:config.promoExpiresAt,testerIds:config.accounts.map(a=>a.id)})
}
export function preflightTesterLedger(path,policy){
  if(existsSync(path+'.owner-lock'))throw new GateError('ledger_locked_fail_closed',503)
  if(!existsSync(path))return
  let data;try{data=JSON.parse(readFileSync(path,'utf8'))}catch{throw new GateError('invalid_ledger_fail_closed',503)}
  if(data.version!==1||data.policyHash!==createHash('sha256').update(JSON.stringify(policy)).digest('hex')||typeof data.entries!=='object'||!data.entries||Array.isArray(data.entries)||typeof data.saves!=='object'||!data.saves||Array.isArray(data.saves)||typeof data.testClosed!=='boolean'||!Number.isSafeInteger(data.spentMicros)||data.spentMicros<0)throw new GateError('invalid_ledger_fail_closed',503)
  const entries=Object.values(data.entries)
  if(entries.some(e=>!['held','reserved','complete','known-failure'].includes(e.status)||!Number.isSafeInteger(e.reservedMicros)||e.reservedMicros<0))throw new GateError('invalid_ledger_fail_closed',503)
  if(data.testClosed||entries.some(e=>['held','reserved'].includes(e.status))||entries.length>=80||policy.capMicros-policy.headroomMicros-data.spentMicros<7680)throw new GateError('tester_review_or_budget_required',403)
}
