import {createSmokeResponsesTransport} from '../acceptance/responsesTransport.mjs'
import {buildGuestBody} from './guestMemoryView.mjs'
import {GateError} from '../acceptance/gate.mjs'
import {guestPreflight,guestLimits} from './guestLivePolicy.mjs'

// Integration seam, not a production route or a live CLI. Fake mode must not
// read the named server secret. No browser can supply this configuration.
export function createGuestProvider({mode='fake',root,approval,getSecret=name=>process.env[name],fetchImpl=globalThis.fetch,now=Date.now()}={}){
 if(mode==='fake')return async()=>({text:'Seraphina lifts the lantern. "[MOCK] Our fictional story can continue."',usage:{inputUnits:100,outputUnits:30},measurement:{provider:'fake',status:'completed',latencyMs:0}})
 if(mode!=='live'||!approval||Object.keys(approval).sort().join()!=='approved,noPaidBilling,promoExpiresAt,remainingPromoUsd,verifiedAt'||approval.approved!==true||approval.noPaidBilling!==true||!Number.isFinite(approval.remainingPromoUsd)||approval.remainingPromoUsd<0.5||!Number.isFinite(Date.parse(approval.verifiedAt))||Date.parse(approval.verifiedAt)>now||now-Date.parse(approval.verifiedAt)>3600000||!Number.isFinite(Date.parse(approval.promoExpiresAt))||Date.parse(approval.promoExpiresAt)<now+guestLimits.durationMs||Date.parse(approval.promoExpiresAt)<guestLimits.promoCutoff||typeof root!=='string')throw new GateError('explicit_current_guest_live_approval_required',403)
 guestPreflight(root,{now})
 // Reuse an existing server-side environment/secret binding by name only.
 // A key alone never selects live mode. Never persist or return the value.
 const key=getSecret('OPENAI_API_KEY')
 return createSmokeResponsesTransport({key,approved:true,maxAttempts:20,fetchImpl,buildBody:buildGuestBody})
}
