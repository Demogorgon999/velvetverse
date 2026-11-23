import { createServer } from 'node:http'
import { GateError, scopeKey } from './gate.mjs'
import { runIsolatedRoleplay, validateFictionalInput } from './orchestration.mjs'
import { appendMemoryLabel } from '../../src/experimental/memoryLabels.ts'
import { authorizedMockAlias } from '../../src/experimental/mockLabelIntegration.ts'

export function createAcceptanceHttp(gate, { middleware = null, readiness = null, authorize = null, requestPolicy=null, basePath = '', screenTurn = null, validateLabelFactId=value=>['alias','meeting','promise'].includes(value), projectAlias=null, projectSave = save => save, work = request => runIsolatedRoleplay(request, gate.policy) } = {}) {
  if(!['','/velvetverse'].includes(basePath))throw new GateError('unsupported_route_prefix',503)
  const reply = (res, status, body) => {
    const text = JSON.stringify(body)
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(text)
  }
  const progress = scope => {
    const save = gate.getSave(scope)
    let alias = null
    try { alias = projectAlias?projectAlias(save,scope):authorizedMockAlias(save.labels, { characterId: scope.characterId, storyScopeId: scope.storyId }) } catch { /* Neutral only. */ }
    return { save: projectSave(save,scope), alias, budget: gate.summary(), pending: Object.values(gate.data.entries).filter(entry => entry.scopeKey === scopeKey(scope) && ['reserved', 'held'].includes(entry.status)).map(entry => ({ requestId: entry.requestId, status: entry.status })) }
  }
  const server = createServer(async (req, res) => {
    const address = server.address()
    const expectedHost = `127.0.0.1:${address?.port}`
    let expectedOrigin=`http://${expectedHost}`
    try{
      if(requestPolicy)expectedOrigin=requestPolicy(req,expectedHost)
      else if(req.headers.host!==expectedHost||(req.headers.origin&&req.headers.origin!==expectedOrigin))throw new GateError('loopback_host_origin_only',403)
    }catch{reply(res,403,{error:'loopback_host_origin_only'});return}
    req.acceptanceOrigin=expectedOrigin
    const url = new URL(req.url, `http://${expectedHost}`)
    if(basePath){if(!url.pathname.startsWith(basePath+'/')){reply(res,404,{error:'not_found'});return}url.pathname=url.pathname.slice(basePath.length);req.url=url.pathname+url.search}
    try { if (authorize) await authorize(req, url) } catch (error) { reply(res, error instanceof GateError ? error.status : 401, { error: error instanceof GateError ? error.code : 'authentication_required' }); return }
    if (!url.pathname.startsWith('/acceptance/')) {
      if (middleware) middleware(req, res, () => reply(res, 404, { error: 'not_found' }))
      else reply(res, 404, { error: 'not_found' })
      return
    }
    try {
      if (req.method === 'GET' && url.pathname === '/acceptance/readiness' && readiness) { reply(res, 200, readiness); return }
      if (req.method === 'GET' && url.pathname === '/acceptance/status') {
        const scope = { testerId: url.searchParams.get('testerId'), storyId: url.searchParams.get('storyId'), characterId: Number(url.searchParams.get('characterId')) }
        if (req.authenticatedTesterId && scope.testerId !== req.authenticatedTesterId) throw new GateError('account_scope_denied', 403)
        reply(res, 200, progress(scope)); return
      }
      if (req.method !== 'POST' || req.headers.origin !== expectedOrigin || !String(req.headers['content-type']).startsWith('application/json')) throw new GateError('same_origin_json_post_required', 403)
      const chunks = []; let length = 0
      for await (const chunk of req) { length += chunk.length; if (length > gate.policy.maxInputBytes) throw new GateError('body_too_large', 413); chunks.push(chunk) }
      const text = Buffer.concat(chunks).toString('utf8')
      let body
      try { body = JSON.parse(text) } catch { throw new GateError('invalid_json', 400) }
      if (url.pathname === '/acceptance/close') { reply(res, 200, await gate.closeTest()); return }
      const { scope } = body; gate.validateScope(scope)
      if (req.authenticatedTesterId && scope.testerId !== req.authenticatedTesterId) throw new GateError('account_scope_denied', 403)
      if (['openai-owner-smoke','openai-tester'].includes(gate.policy.provider) && ['turn', 'label'].some(action => url.pathname === '/acceptance/' + action) && body.providerConsent !== gate.policy.provider) throw new GateError('explicit_live_browser_consent_required', 403)
      if (url.pathname === '/acceptance/turn') {
        validateFictionalInput(body.input)
        const screened=screenTurn?.(body.input)
        if(screened){reply(res,200,{...screened,progress:progress(scope)});return}
        const result = await gate.execute(scope, body.requestId, body.input, work, req.authenticatedSessionTag ? { sessionTag: req.authenticatedSessionTag } : null)
        reply(res, 200, { ...result, progress: progress(scope) }); return
      }
      if (url.pathname === '/acceptance/new-session') {
        await gate.updateSave(scope, save => ({ ...save, conversation: save.conversation + 1, transcript: [] }))
        reply(res, 200, progress(scope)); return
      }
      if (url.pathname === '/acceptance/label') {
        if (!['add', 'correct', 'revoke'].includes(body.action) || !validateLabelFactId(body.factId) || typeof body.value !== 'string' || body.value.length > 512) throw new GateError('invalid_explicit_label_action', 400)
        await gate.updateSave(scope, save => {
          const prior = save.labels.events.filter(event => event.characterId === scope.characterId && event.storyScopeId === scope.storyId && event.factId === body.factId).at(-1)
          if ((body.action === 'add' && prior) || (body.action !== 'add' && !prior)) throw new GateError('explicit_correction_link_required', 400)
          const sequence = save.labels.events.length + 1
          const labels = appendMemoryLabel(save.labels, { version: 1, id: `event-${sequence}`, sequence,
            origin: { eventId: `fictional-event-${sequence}`, turnId: `fictional-label-action-${sequence}` }, characterId: scope.characterId,
            storyScopeId: scope.storyId, conversationId: `session-${save.conversation}`, factId: body.factId, provenance: body.provenance,
            visibility: body.visibility, observedBy: body.witnessed === true ? [scope.characterId] : [], status: body.action === 'revoke' ? 'revoked' : 'active',
            supersedesId: prior?.id ?? null, summary: body.action === 'revoke' ? '' : body.value })
          return { ...save, labels }
        })
        reply(res, 200, progress(scope)); return
      }
      throw new GateError('not_found', 404)
    } catch (error) { reply(res, error instanceof GateError ? error.status : 400, { error: error instanceof GateError ? error.code : 'request_blocked_no_retry', budget: gate.summary() }) }
  })
  return server
}
