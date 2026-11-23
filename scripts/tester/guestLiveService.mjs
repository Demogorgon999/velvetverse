import {join} from 'node:path'
import {scryptSync,randomBytes} from 'node:crypto'
import {GuestLiveGate} from './guestLivePolicy.mjs'
import {guestProxyContract} from './guestFixture.mjs'
import {createTesterServer} from './server.mjs'
import {buildGuestPlayer} from '../build-guest-player.mjs'
export async function createGuestLiveService({root,password,transport,now=()=>Date.now(),onTerminal=()=>{}}){
  if(typeof password!=='string'||password.length<24||password.length>128||typeof transport!=='function')throw new Error('explicit_guest_launch_required')
  const gate=new GuestLiveGate(root,{now}),salt=randomBytes(16).toString('hex')
  const account={id:'guest',username:'guest',salt,hash:scryptSync(password,salt,64).toString('hex')}
  let service,timer,closing
  try{
    const playerDirectory=join(root,'player-assets');await buildGuestPlayer(playerDirectory,{guest:true})
    service=await createTesterServer({gate,accounts:[account],transport,now,guestPlayer:true,requestPolicy:guestProxyContract,playerDirectory})
    const original=service.stop
    service.stop=()=>{if(!closing){clearInterval(timer);closing=original()}return closing}
    timer=setInterval(()=>{if(gate.terminal()){clearInterval(timer);setTimeout(()=>{void service.stop().then(onTerminal,onTerminal)},400)}},250)
    return{...service,gate}
  }catch(error){clearInterval(timer);if(service)await service.stop();else await gate.close();throw error}
}
