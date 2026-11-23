// @vitest-environment node
import {spawn} from 'node:child_process'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {it,expect} from 'vitest'
it('runs the actual one-command fake guest player, persists a custom turn across login and closes on EOF',async()=>{
 const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/run-guest.mjs',import.meta.url))],{cwd:mkdtempSync(join(tmpdir(),'vv-guest-command-')),stdio:['pipe','pipe','pipe'],windowsHide:true})
 let text='';const closed=new Promise<number|null>(resolve=>child.once('exit',resolve))
 const ready=new Promise<string>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Mock launcher readiness timeout')),15000);child.stdout.on('data',chunk=>{text+=chunk.toString();const url=text.match(/MOCK ONLY: (http:\/\/127\.0\.0\.1:\d+\/velvetverse\/)/)?.[1];if(url){clearTimeout(timer);resolve(url)}});child.once('error',error=>{clearTimeout(timer);reject(error)});child.once('exit',()=>{clearTimeout(timer);reject(new Error('Mock launcher exited before readiness'))})})
 try{
  const origin=await ready;expect(text).toContain('MOCK ONLY')
  const page=await fetch(origin);expect(await page.text()).toContain('/player/player.js')
  const assets=await fetch(origin+'player/player.js');expect(assets.status).toBe(200);expect(await assets.text()).toContain('Lady Seraphina')
  let cookie='',csrf='';const request=(path:string,body?:object)=>fetch(origin+path,{method:body?'POST':'GET',headers:{...(body?{Origin:new URL(origin).origin,'Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined})
  const login=async()=>{const response=await request('tester/login',{username:'guest',password:'synthetic-guest-only'});expect(response.status).toBe(200);expect(response.headers.get('set-cookie')).not.toContain('Secure;');cookie=response.headers.get('set-cookie')!.split(';')[0];csrf=(await response.json()).csrf}
  await login();const scope={testerId:'fixture-guest',storyId:'story-one',characterId:1}
  const turn=await request('acceptance/turn',{scope,providerConsent:'tester-fake',requestId:'command-scene',input:{spoken:'Shall we carry a lantern to the bridge?',visibleAction:'',privateThought:'COMMAND_PRIVATE_CANARY',shareObserved:true}})
  expect(turn.status).toBe(200);const result=await turn.json();expect(result.engineReceipt.finalDispatches).toBe(1);expect(result.reply).toContain('[MOCK');expect(result.capture).not.toContain('COMMAND_PRIVATE_CANARY')
  await request('tester/logout',{});cookie='';csrf='';await login()
  const saved=await(await request('acceptance/status?testerId=fixture-guest&storyId=story-one&characterId=1')).json();expect(saved.save.transcript).toHaveLength(1);expect(saved.budget.attemptsRemaining).toBe(19)
  const redirect=await(await request('acceptance/turn',{scope,providerConsent:'tester-fake',requestId:'weather',input:{spoken:'What is the current weather in JHB?',visibleAction:'',privateThought:'',shareObserved:true}})).json();expect(redirect.engineReceipt.finalDispatches).toBe(0);expect(redirect.progress.budget.attemptsRemaining).toBe(19)
  child.stdin.end();expect(await closed).toBe(0);await expect(fetch(origin)).rejects.toThrow()
 }finally{if(child.exitCode===null){child.stdin.end();const timer=setTimeout(()=>child.kill(),3000);await closed;clearTimeout(timer)}}
},20000)
