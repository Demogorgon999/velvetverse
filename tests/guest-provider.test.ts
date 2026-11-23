// @vitest-environment node
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {it,expect,vi} from 'vitest'
import {createGuestProvider} from '../scripts/tester/guestProvider.mjs'
import {createConfiguredGuestService} from '../scripts/tester/configuredGuestService.mjs'
import {buildGuestMemoryView,buildGuestBody} from '../scripts/tester/guestMemoryView.mjs'
import {smokePolicy} from '../scripts/acceptance/livePolicy.mjs'
const now=Date.parse('2026-11-18T06:00:00Z')
const approval={approved:true,noPaidBilling:true,verifiedAt:new Date(now).toISOString(),remainingPromoUsd:1,promoExpiresAt:'2026-11-25T00:00:00Z'}
it('defaults to fake without reading a secret or network; invalid live gates fail before lookup',async()=>{
 const secret=vi.fn(()=>{throw new Error('Secret lookup forbidden')}),network=vi.fn(()=>{throw new Error('Network forbidden')})
 const fake=createGuestProvider({getSecret:secret,fetchImpl:network})
 expect((await fake()).text).toContain('[MOCK]')
 for(const patch of [{mode:'live'},{mode:'unsupported'},{mode:'live',approval:{...approval,noPaidBilling:false}},{mode:'live',approval:{...approval,promoExpiresAt:'invalid'}}])expect(()=>createGuestProvider({...patch,getSecret:secret,fetchImpl:network,now})).toThrow()
 expect(secret).not.toHaveBeenCalled();expect(network).not.toHaveBeenCalled()
})
it('reuses only the named server binding after approval and serializes the real guest view through fixed Responses',async()=>{
 const root=mkdtempSync(join(tmpdir(),'vv-review-provider-')),secret=vi.fn(()=> 'synthetic-provider-fixture-only')
 const scope={testerId:'guest',storyId:'story-one',characterId:1}
 const view=buildGuestMemoryView({labels:{version:1,events:[]}},scope,{spoken:'Shall we carry the lantern?',visibleAction:''})
 const network=vi.fn(async(endpoint:string,options:{body:string})=>{
  expect(endpoint).toBe('https://api.openai.com/v1/responses');expect(JSON.parse(options.body)).toEqual(buildGuestBody(view.packet))
  return Response.json({model:smokePolicy.model,service_tier:'default',status:'completed',usage:{input_tokens:100,output_tokens:30},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Seraphina lifts the lantern. "[MOCK] We can wait."'}]}]})
 })
 const provider=createGuestProvider({mode:'live',root,approval,getSecret:secret,fetchImpl:network,now})
 expect(secret).toHaveBeenCalledExactlyOnceWith('OPENAI_API_KEY')
 await provider(view.packet,new AbortController().signal);expect(network).toHaveBeenCalledOnce()
 expect(()=>createGuestProvider({mode:'live',root,approval,getSecret:secret,fetchImpl:network,now:Date.parse('2026-11-26T00:00:00Z')})).toThrow()
 await expect(createConfiguredGuestService({mode:'live',localOnly:true})).rejects.toThrow('https_contract')
})
it('connects named-secret provider composition to authenticated guest chat and exact scoped OpenAI wire using fake fetch only',async()=>{
 const root=mkdtempSync(join(tmpdir(),'vv-configured-guest-')),password='synthetic-guest-password-fixture',secret=vi.fn(()=> 'synthetic-provider-fixture-only'),bodies:unknown[]=[]
 const network=vi.fn(async(_endpoint:string,options:{body:string})=>{const body=JSON.parse(options.body);bodies.push(body);expect(options.body).toContain('rockslide');expect(options.body).not.toContain('PRIVATE_FIXTURE_THOUGHT');return Response.json({model:smokePolicy.model,service_tier:'default',status:'completed',usage:{input_tokens:100,output_tokens:30},output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Seraphina studies the crossing. "[MOCK] The bridge is closed."'}]}]})})
 const service=await createConfiguredGuestService({mode:'live',root,password,approval,getSecret:secret,fetchImpl:network,now:()=>now})
 try{
  await new Promise<void>(resolve=>service.server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${(service.server.address() as {port:number}).port}`
  let cookie='',csrf='';const request=(path:string,body?:object)=>fetch(origin+'/velvetverse'+path,{method:body?'POST':'GET',headers:{'X-Forwarded-Proto':'https','X-Forwarded-Host':'guest.example.test',...(body?{Origin:'https://guest.example.test','Content-Type':'application/json','X-CSRF-Token':csrf}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined})
  const login=await request('/tester/login',{username:'guest',password});cookie=login.headers.get('set-cookie')!.split(';')[0];csrf=(await login.json()).csrf
  const scope={testerId:'guest',storyId:'story-one',characterId:1}
  expect((await request('/acceptance/label',{scope,providerConsent:'openai-tester',action:'add',factId:'fact-route',value:'A rockslide closed the old bridge.',provenance:'observed',visibility:'provider-shared',witnessed:true})).status).toBe(200)
  const response=await request('/acceptance/turn',{scope,providerConsent:'openai-tester',requestId:'configured-bridge',input:{spoken:'Which crossing should we take?',visibleAction:'',privateThought:'PRIVATE_FIXTURE_THOUGHT',shareObserved:true}})
  expect(response.status).toBe(200);const result=await response.json();expect(result.engineReceipt.finalDispatches).toBe(1);expect(JSON.parse(result.capture)).toEqual(bodies[0]);expect(result.progress.save.transcript).toHaveLength(1)
  expect(network).toHaveBeenCalledOnce();expect(secret).toHaveBeenCalledExactlyOnceWith('OPENAI_API_KEY');expect(service.gate.summary()).toMatchObject({attemptsRemaining:19,heldMicros:0})
 }finally{await service.stop()}
},15000)
