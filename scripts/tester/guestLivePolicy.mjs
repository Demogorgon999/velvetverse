import {existsSync,readFileSync,mkdirSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs'
import {join} from 'node:path'
import {TesterGate,testerPolicy,preflightTesterLedger} from './policy.mjs'
import {GateError} from '../acceptance/gate.mjs'
export const guestLimits=Object.freeze({attempts:20,durationMs:7200000,capMicros:250000,headroomMicros:25000,promoCutoff:Date.parse('2026-11-25T00:00:00Z')})
function durableCreate(path,value){const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,JSON.stringify(value));fsyncSync(fd)}finally{closeSync(fd)}}
export function guestLease(root,{now=Date.now(),create=false}={}){
  if(now>=guestLimits.promoCutoff-guestLimits.durationMs)throw new GateError('guest_promo_window_unavailable',403)
  const path=join(root,'window.json');let lease
  if(existsSync(path)){try{lease=JSON.parse(readFileSync(path,'utf8'))}catch{throw new GateError('guest_window_unreadable',503)}}
  else{if(existsSync(join(root,'ledger.json')))throw new GateError('guest_window_missing_no_reset',503);lease={version:1,approvedFor:'one-friend-pilot',startedAt:now,expiresAt:now+guestLimits.durationMs};if(create){mkdirSync(root,{recursive:true});durableCreate(path,lease)}}
  if(!lease||Object.keys(lease).sort().join()!=='approvedFor,expiresAt,startedAt,version'||lease.version!==1||lease.approvedFor!=='one-friend-pilot'||!Number.isSafeInteger(lease.startedAt)||lease.startedAt>now||lease.expiresAt!==lease.startedAt+guestLimits.durationMs||lease.expiresAt>guestLimits.promoCutoff||lease.expiresAt<=now)throw new GateError('guest_window_expired_or_invalid',403)
  return lease
}
export function guestLivePolicy(lease){return testerPolicy({mode:'live',capMicros:250000,creditCeilingMicros:1000000,expiresAt:new Date(lease.expiresAt).toISOString(),testerIds:['guest']})}
export function guestPreflight(root,{now=Date.now()}={}){
  if(existsSync(join(root,'window.json'))&&!existsSync(join(root,'ledger.json')))throw new GateError('guest_ledger_missing_no_reset',503)
  const lease=guestLease(root,{now}),policy=guestLivePolicy(lease),path=join(root,'ledger.json')
  preflightTesterLedger(path,policy)
  if(existsSync(path)&&Object.keys(JSON.parse(readFileSync(path,'utf8')).entries).length>=20)throw new GateError('guest_twenty_attempts_consumed',403)
  return{lease,policy}
}
export class GuestLiveGate extends TesterGate{
  constructor(root,{now=()=>Date.now()}={}){
    const {lease,policy}=guestPreflight(root,{now:now()})
    guestLease(root,{now:now(),create:true})
    super(join(root,'ledger.json'),policy,{now,leaseExpiresAt:lease.expiresAt})
  }
  checkAttemptLimit(context,scope){super.checkAttemptLimit(context,scope);if(Object.keys(this.data.entries).length>=20)throw new GateError('guest_twenty_attempts_consumed',403)}
  terminal(){const entries=Object.values(this.data.entries);return this.now()>=this.leaseExpiresAt||this.data.testClosed||entries.some(e=>e.status==='held')||!entries.some(e=>e.status==='reserved')&&(entries.length>=20||this.summary().availableMicros<this.reservationMicros())}
  summary(){return{...super.summary(),attemptsRemaining:Math.max(0,20-Object.keys(this.data.entries).length),guestPilot:true,platformBalanceVerified:false}}
}
