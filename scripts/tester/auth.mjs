import { randomBytes,scryptSync,timingSafeEqual,createHash } from 'node:crypto'
import { GateError } from '../acceptance/gate.mjs'
export function syntheticAccounts(){return ['a','b'].map(letter=>{const salt=Buffer.alloc(16,letter).toString('hex');return{id:'fixture-'+letter,username:letter==='a'?'alice':'bob',salt,hash:scryptSync('fictional-'+(letter==='a'?'alice':'bob')+'-only',salt,64).toString('hex')}})}
export function validateAccounts(accounts){
  if(!Array.isArray(accounts)||!accounts.length||accounts.length>2||accounts.some(a=>!a||Object.keys(a).sort().join()!=='hash,id,salt,username'||!/^[a-z0-9-]{1,32}$/.test(a.id)||!/^[a-z0-9-]{3,32}$/.test(a.username)||!/^[a-f0-9]{32}$/.test(a.salt)||!/^[a-f0-9]{128}$/.test(a.hash))||new Set(accounts.map(a=>a.id)).size!==accounts.length||new Set(accounts.map(a=>a.username)).size!==accounts.length)throw new GateError('tester_accounts_not_configured',503)
  return accounts
}
const digest=value=>createHash('sha256').update(value).digest('hex')
const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const left=Buffer.from(a),right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right)}
export class TesterAuth{
  constructor(accounts,{now=()=>Date.now(),absoluteMs=30*60000,idleMs=15*60000,cookieName='vv_tester'}={}){if(!['vv_tester','__Secure-vv_guest'].includes(cookieName))throw new GateError('invalid_session_cookie',503);this.cookieName=cookieName;this.accounts=validateAccounts(accounts);this.now=now;this.absoluteMs=absoluteMs;this.idleMs=idleMs;this.sessions=new Map();this.loginAttempts=[]}
  prune(){for(const[key,s]of this.sessions)if(this.now()>=s.expiresAt||this.now()-s.seen>=this.idleMs)this.sessions.delete(key)}
  login(username,password){
    this.prune();this.loginAttempts=this.loginAttempts.filter(t=>this.now()-t<60000)
    if(this.loginAttempts.length>=5)throw new GateError('login_rate_limited',429)
    this.loginAttempts.push(this.now())
    if(typeof username!=='string'||typeof password!=='string'||password.length>128)throw new GateError('login_failed',401)
    const account=this.accounts.find(a=>a.username===username);const candidate=account??this.accounts[0]
    const valid=timingSafeEqual(scryptSync(password,candidate.salt,64),Buffer.from(candidate.hash,'hex'))
    if(!account||!valid)throw new GateError('login_failed',401)
    const own=[...this.sessions.entries()].filter(([,s])=>s.accountId===account.id)
    if(own.length>=2)this.sessions.delete(own[0][0])
    if(this.sessions.size>=8)throw new GateError('session_limit',429)
    const token=randomBytes(32).toString('hex');const session={accountId:account.id,username:account.username,csrf:randomBytes(32).toString('hex'),tag:randomBytes(16).toString('hex'),expiresAt:this.now()+this.absoluteMs,seen:this.now()}
    this.sessions.set(digest(token),session);return{token,session}
  }
  require(req,{mutation=false}={}){
    this.prune();const prefix=this.cookieName+'=';const token=String(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith(prefix))?.slice(prefix.length)
    if(!/^[a-f0-9]{64}$/.test(token??''))throw new GateError('authentication_required',401)
    const session=this.sessions.get(digest(token));if(!session)throw new GateError('session_expired_or_logged_out',401)
    if(mutation&&!equal(req.headers['x-csrf-token'],session.csrf))throw new GateError('csrf_required',403)
    session.seen=this.now();return session
  }
  logout(req){const prefix=this.cookieName+'=';const token=String(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith(prefix))?.slice(prefix.length);if(token)this.sessions.delete(digest(token))}
  clear(){this.sessions.clear()}
}
export const sessionCookie=(token,{name='vv_tester',secure=false,maxAge=1800}={})=>{if(!['vv_tester','__Secure-vv_guest'].includes(name)||name==='__Secure-vv_guest'&&!secure)throw new GateError('invalid_session_cookie',503);return`${name}=${token}; HttpOnly; SameSite=Strict; Path=/velvetverse; Max-Age=${maxAge}${secure?'; Secure':''}`}
