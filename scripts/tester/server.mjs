import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { registerHooks } from 'node:module'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import { TesterAuth,sessionCookie } from './auth.mjs'
import { GateError } from '../acceptance/gate.mjs'
import { approvedRecentDialogue,captureDialogueEvent,buildTesterBody } from './projection.mjs'
import { screenTesterTurn } from './guardrails.mjs'
import { GuestLiveGate } from './guestLivePolicy.mjs'
import {buildGuestMemoryView,guestCorePacket,buildGuestBody,captureGuestDialogue,guestVisibleTranscript} from './guestMemoryView.mjs'
import {storyPresentation} from './storyPresentation.mjs'

export async function createTesterServer({gate,accounts,transport,now=()=>Date.now(),authOptions={},guestPlayer=false,localGuestFixture=false,requestPolicy=null,playerDirectory=fileURLToPath(new URL('../../.guest-review/player-assets/',import.meta.url))}){
  if(localGuestFixture&&!(gate.guestFixture===true&&gate.policy.mode==='fake'))throw new GateError('local_fixture_requires_fake_gate',403)
  const permittedGuest=gate.guestFixture===true&&gate.policy.mode==='fake'&&accounts?.[0]?.id==='fixture-guest'||gate instanceof GuestLiveGate&&gate.policy.mode==='live'&&accounts?.[0]?.id==='guest'
  if(guestPlayer&&(!permittedGuest||accounts?.length!==1||!requestPolicy))throw new GateError('offline_guest_fixture_required',403)
  registerHooks({resolve(specifier,context,next){return next(specifier==='./memoryLabels'?specifier+'.ts':specifier,context)}})
  const {createAcceptanceHttp}=await import('../acceptance/http.mjs')
  const {runIsolatedRoleplay}=await import('../acceptance/orchestration.mjs')
  const cookieOptions=guestPlayer&&!localGuestFixture?{name:'__Secure-vv_guest',secure:true}:{}
  const auth=new TesterAuth(accounts,{now,...authOptions,...(guestPlayer&&!localGuestFixture?{cookieName:'__Secure-vv_guest'}:{})})
  const playerEnabled=guestPlayer
  const page='Guest player only.'
  const playerAssets=playerEnabled?{
    '/player/player.js':{type:'text/javascript; charset=utf-8',body:readFileSync(join(playerDirectory,'player.js'))},
    '/player/player.css':{type:'text/css; charset=utf-8',body:readFileSync(join(playerDirectory,'player.css'))}
  }:null
  const playerPage='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VelvetVerse — Lady Seraphina</title><link rel="stylesheet" href="/velvetverse/player/player.css"></head><body><div id="root"></div><script defer src="/velvetverse/player/player.js"></script></body></html>'
  const display=save=>{
    let memory={},mood={};try{memory=JSON.parse(save.state?.['velvetverse-memory-1']??'{}')}catch{/* No raw state export. */}
    try{mood=JSON.parse(save.state?.['velvetverse-mood-1']??'{}')}catch{/* Neutral display only. */}
    return{relationshipScore:Number.isFinite(memory?.relationshipScore)?Math.max(-10,Math.min(10,memory.relationshipScore)):0,
      mood:{mood:['Calm','Curious','Playful','Affectionate','Protective','Sad','Irritated','Suspicious'].includes(mood?.mood)?mood.mood:'Calm',intensity:Number.isInteger(mood?.intensity)?Math.max(1,Math.min(5,mood.intensity)):1,reason:'',updatedAt:''}}
  }
  const json=(res,status,value,headers={})=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(value))}
  const server=createAcceptanceHttp(gate,{
    basePath:'/velvetverse',
    requestPolicy,
    screenTurn:screenTesterTurn,
    guestStories:guestPlayer,
    ...(guestPlayer?{validateLabelFactId:value=>['alias','meeting','promise'].includes(value)||typeof value==='string'&&/^fact-[a-z0-9-]{1,32}$/.test(value),projectAlias:(save,scope)=>buildGuestMemoryView(save,scope,{spoken:'',visibleAction:''}).packet.alias}:{}),
    authorize(req,url){
      if(!url.pathname.startsWith('/acceptance/'))return
      gate.active()
      const session=auth.require(req,{mutation:req.method!=='GET'})
      if(req.method!=='GET'){session.actions=(session.actions??0)+1;if(session.actions>100)throw new GateError('session_mutation_limit',429)}
      if(url.pathname==='/acceptance/close'||url.pathname==='/acceptance/readiness')throw new GateError('owner_only',403)
      req.authenticatedTesterId=session.accountId;req.authenticatedSessionTag=session.tag
    },
    projectSave:(save,scope)=>({conversation:save.conversation,transcript:guestPlayer?guestVisibleTranscript(save,scope):save.transcript,...(guestPlayer?storyPresentation(save,scope):{labels:save.labels}),...(playerEnabled?{display:display(save)}:{})}),
    work:async request=>{
      let view=null
      if(guestPlayer){try{view=buildGuestMemoryView(request.save,request.scope,request.input)}catch(error){throw Object.assign(new GateError(error.code??'invalid_guest_view_before_dispatch',400),{knownNoDispatch:true})}}
      const history=view?null:approvedRecentDialogue(request.save,request.scope)
      let providerReply=null,finalCapture=null
      const core=view?guestCorePacket(view):null
      const result=await runIsolatedRoleplay(view?{...request,guestMemoryCore:core}:request,gate.policy,async(packet,signal)=>{
        if(view&&JSON.stringify(packet)!==JSON.stringify(core))throw Object.assign(new GateError('guest_snapshot_changed_before_dispatch',503),{knownNoDispatch:true})
        const projected=view?view.packet:{...packet,recentDialogue:history}
        finalCapture=JSON.stringify(view?buildGuestBody(projected):buildTesterBody(projected))
        const generated=await transport(projected,signal);providerReply=generated.text;return generated
      })
      result.capture=finalCapture
      result.save=view?captureGuestDialogue(result.save,request.scope,request.input,request.requestId,result.engineReceipt.finalDispatches===1&&providerReply===result.reply?providerReply:null,view):captureDialogueEvent(result.save,request.scope,request.input,result.reply,request.requestId,result.engineReceipt.finalDispatches===1?providerReply:null)
      if(Buffer.byteLength(JSON.stringify(result.save))>524288)throw Object.assign(new GateError('tester_save_bound',502),{knownUsage:result.usage})
      return result
    },
    middleware:async(req,res)=>{
      const url=new URL(req.url,'http://127.0.0.1');const origin=req.acceptanceOrigin??`http://${req.headers.host}`
      try{
        if(guestPlayer&&url.pathname.startsWith('/qa'))throw new GateError('not_found',404)
        if(req.method==='GET'&&playerEnabled&&Object.hasOwn(playerAssets,url.pathname)){
          const asset=playerAssets[url.pathname];res.writeHead(200,{'Content-Type':asset.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(asset.body);return
        }
        if(req.method==='GET'&&url.pathname==='/'){
          const headers={}
          const nonce=randomBytes(16).toString('base64')
          res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
            'Content-Security-Policy':`default-src 'none'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,...headers})
          res.end(playerEnabled&&url.pathname==='/'?playerPage:page.replaceAll('__NONCE__',nonce));return
        }
        gate.active()
        if(req.method==='GET'&&url.pathname==='/tester/session'){
          const session=auth.require(req);json(res,200,{accountId:session.accountId,username:session.username,csrf:session.csrf,expiresAt:session.expiresAt,mode:gate.policy.mode,consent:gate.policy.provider});return
        }
        if(req.method!=='POST'||req.headers.origin!==origin||!String(req.headers['content-type']).startsWith('application/json'))throw new GateError('same_origin_json_required',403)
        if(url.pathname==='/tester/logout'){auth.require(req,{mutation:true});auth.logout(req);json(res,200,{loggedOut:true},{'Set-Cookie':sessionCookie('',{...cookieOptions,maxAge:0})});return}
        if(url.pathname!=='/tester/login')throw new GateError('not_found',404)
        const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>1024)throw new GateError('login_body_bound',413);chunks.push(chunk)}
        let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new GateError('login_failed',401)}
        const {token,session}=auth.login(body.username,body.password)
        json(res,200,{accountId:session.accountId,username:session.username,csrf:session.csrf,expiresAt:session.expiresAt,mode:gate.policy.mode,consent:gate.policy.provider},{'Set-Cookie':sessionCookie(token,cookieOptions)})
      }catch(error){json(res,error instanceof GateError?error.status:400,{error:error instanceof GateError?error.code:'request_blocked'})}
    }
  })
  server.requestTimeout=30000;server.headersTimeout=10000;server.maxHeadersCount=40
  server.maxConnections=16;server.maxRequestsPerSocket=100;server.keepAliveTimeout=5000
  return{server,auth,async stop(){auth.clear();server.closeAllConnections();if(server.listening)await new Promise(resolve=>server.close(resolve));await gate.close()}}
}
