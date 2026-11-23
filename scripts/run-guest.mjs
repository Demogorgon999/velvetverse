import {resolve} from 'node:path'
import {createGuestFixtureService} from './tester/guestFixture.mjs'
// This public review command is deliberately fake-only. It never reads secrets.
if(process.argv.length!==2)throw new Error('guest_review_command_is_fake_only')
const service=await createGuestFixtureService({root:resolve('.guest-review'),localOnly:true})
const stop=async()=>{await service.stop();process.exitCode=0}
process.once('SIGINT',()=>void stop());process.once('SIGTERM',()=>void stop())
if(!process.stdin.isTTY){process.stdin.resume();process.stdin.once('end',()=>void stop())}
service.server.once('error',()=>{console.error('Guest mock listener unavailable; no retry.');void stop()})
service.server.listen(0,'127.0.0.1',()=>{
 console.log(`MOCK ONLY: http://127.0.0.1:${service.server.address().port}/velvetverse/`)
 console.log('Synthetic fixture login: guest / synthetic-guest-only. No model traffic. Ctrl+C stops this instance.')
 console.log('Persistent isolated mock story; 20 attempts or two hours, no automatic renewal. New Chat clears visible transcript.')
})
