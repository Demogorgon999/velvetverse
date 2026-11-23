import {createGuestProvider} from './guestProvider.mjs'
import {createGuestFixtureService} from './guestFixture.mjs'
import {createGuestLiveService} from './guestLiveService.mjs'
// Trusted server composition only. Not imported by the ordinary app or exposed
// as a browser endpoint. Deployment/proxy/key provisioning are intentionally absent.
export async function createConfiguredGuestService({mode='fake',root,password,approval,getSecret,fetchImpl,now=()=>Date.now(),localOnly=false,onTerminal}={}){
 if(mode==='fake')return createGuestFixtureService({root,now,localOnly,transport:createGuestProvider()})
 if(localOnly)throw new Error('live_requires_explicit_https_contract')
 const transport=createGuestProvider({mode,root,approval,getSecret,fetchImpl,now:now()})
 return createGuestLiveService({root,password,transport,now,onTerminal})
}
