import {mkdtempSync,existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {scryptSync} from 'node:crypto'
import {TesterGate,testerPolicy} from './policy.mjs'
import {GateError} from '../acceptance/gate.mjs'
import {createTesterServer} from './server.mjs'
import {buildGuestPlayer} from '../build-guest-player.mjs'
export const guestOrigin='https://guest.example.test'
export const proposedGuestPlan=Object.freeze({approved:false,mode:'offline-fixture-only',attempts:20,durationMs:2*3600000,capMicros:250000,headroomMicros:25000})
export function guestProxyContract(req,expectedHost){
  if(req.socket.remoteAddress!=='127.0.0.1'||req.headers.host!==expectedHost||req.headers['x-forwarded-proto']!=='https'||req.headers['x-forwarded-host']!=='guest.example.test'||req.headers.forwarded||req.headers.origin&&req.headers.origin!==guestOrigin)throw new GateError('untrusted_guest_proxy_or_origin',403)
  return guestOrigin
}
export function localFixtureContract(req,host){if(req.socket.remoteAddress!=='127.0.0.1'||req.headers.host!==host||req.headers['x-forwarded-host']||req.headers['x-forwarded-proto']||req.headers.forwarded||req.headers.origin&&req.headers.origin!=='http://'+host)throw new GateError('loopback_fixture_only',403);return 'http://'+host}
export function syntheticGuestAccount(){const salt='67'.repeat(16);return{id:'fixture-guest',username:'guest',salt,hash:scryptSync('synthetic-guest-only',salt,64).toString('hex')}}
export class GuestFixtureGate extends TesterGate{
  constructor(root,{now=()=>Date.now()}={}){
    const ledger=join(root,'ledger.json'),windowPath=join(root,'guest-fixture-window.json');let window
    if(existsSync(windowPath))window=JSON.parse(readFileSync(windowPath,'utf8'))
    else{if(existsSync(ledger))throw new GateError('missing_guest_fixture_window',503);const startedAt=now();window={version:1,fixtureOnly:true,startedAt,expiresAt:startedAt+proposedGuestPlan.durationMs};writeFileSync(windowPath,JSON.stringify(window),{flag:'wx'})}
    if(Object.keys(window).sort().join()!=='expiresAt,fixtureOnly,startedAt,version'||window.version!==1||window.fixtureOnly!==true||!Number.isSafeInteger(window.startedAt)||window.startedAt>now()||window.expiresAt!==window.startedAt+proposedGuestPlan.durationMs||window.expiresAt<=now())throw new GateError('expired_or_invalid_guest_fixture',403)
    const policy=testerPolicy({mode:'fake',capMicros:proposedGuestPlan.capMicros,creditCeilingMicros:1000000,expiresAt:new Date(window.expiresAt).toISOString(),testerIds:['fixture-guest']})
    super(ledger,policy,{now,leaseExpiresAt:window.expiresAt});this.guestFixture=true
  }
  checkAttemptLimit(context,scope){super.checkAttemptLimit(context,scope);if(Object.keys(this.data.entries).length>=20)throw new GateError('guest_twenty_attempts_consumed',403)}
  summary(){return{...super.summary(),attemptsRemaining:Math.max(0,20-Object.keys(this.data.entries).length),liveApproved:false,fixtureOnly:true}}
}
export async function createGuestFixtureService({root=mkdtempSync(join(tmpdir(),'vv-guest-fixture-')),now=()=>Date.now(),transport=async()=>({text:'Seraphina lifts the lantern. "[MOCK GUEST] Our fictional story may continue."',usage:{inputUnits:100,outputUnits:30}}),shutdownAfterMs,localOnly=false}={}){
  mkdirSync(root,{recursive:true})
  const gate=new GuestFixtureGate(root,{now}),playerDirectory=join(root,'player-assets')
  let service,timer,terminalTimer
  try{
    await buildGuestPlayer(playerDirectory,{guest:true})
    service=await createTesterServer({gate,accounts:[syntheticGuestAccount()],transport,now,guestPlayer:true,localGuestFixture:localOnly,requestPolicy:localOnly?localFixtureContract:guestProxyContract,playerDirectory})
    const close=service.stop;let closing
    service.stop=()=>{if(closing)return closing;clearTimeout(timer);clearInterval(terminalTimer);closing=close();return closing}
    const remaining=Math.max(1,gate.leaseExpiresAt-now())
    if(shutdownAfterMs!==undefined&&(!Number.isSafeInteger(shutdownAfterMs)||shutdownAfterMs<1||shutdownAfterMs>remaining))throw new Error('invalid_fixture_shutdown')
    timer=setTimeout(()=>void service.stop(),shutdownAfterMs??remaining)
    terminalTimer=setInterval(()=>{const entries=Object.values(gate.data.entries);if(entries.some(e=>e.status==='held')||!entries.some(e=>e.status==='reserved')&&(entries.length>=20||gate.summary().availableMicros<gate.reservationMicros()))void service.stop()},250)
    return{...service,gate,root}
  }catch(error){clearTimeout(timer);clearInterval(terminalTimer);if(service)await service.stop();else await gate.close();throw error}
}
