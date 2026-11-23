import { GateError } from './gate.mjs'
import { smokePolicy } from './livePolicy.mjs'
const bytes = value => Buffer.byteLength(typeof value === 'string' ? value : JSON.stringify(value))
const endpoint = 'https://api.openai.com/v1/responses'
export function buildSmokeBody(packet) {
  const fields = ['mode', 'characterId', 'storyScopeId', 'alias', 'observedSpoken', 'observedAction', 'memories']
  if (!packet || Object.keys(packet).sort().join() !== fields.sort().join() || packet.mode !== 'acceptance-fake-only' || packet.characterId !== 1 ||
    !/^[a-z0-9-]{1,40}$/.test(packet.storyScopeId) || !(packet.alias === null || typeof packet.alias === 'string' && bytes(packet.alias) <= 600) ||
    !['observedSpoken', 'observedAction'].every(key => typeof packet[key] === 'string' && packet[key].length <= 2000) || !(packet.observedSpoken.trim() || packet.observedAction.trim()) ||
    !Array.isArray(packet.memories) || packet.memories.length > 3 || packet.memories.some(record => !record || Object.keys(record).sort().join() !== 'id,summary' || typeof record.id !== 'string' || typeof record.summary !== 'string') || bytes(packet.memories) > 1200) {
    throw Object.assign(new GateError('unapproved_projection_no_dispatch', 400), { knownNoDispatch: true })
  }
  const body = { model: smokePolicy.model, service_tier: 'default', store: false, stream: false, max_output_tokens: 256, reasoning: { effort: 'none' },
    input: [{ role: 'system', content: 'Write Lady Seraphina\'s next fictional, non-explicit response in under 100 words. Use third-person character narration and quoted speech. Respect only the observed scene and explicitly allowed memories. Do not invent remembered events, expose private/offscreen information, or narrate the traveler\'s private experience. Character autonomy remains local; this is a limited approved dialogue projection, not full brain context.' },
      { role: 'user', content: JSON.stringify({ ...packet, mode: 'acceptance-live-scoped-v1' }) }] }
  if (bytes(body) > smokePolicy.maxInputBytes) throw Object.assign(new GateError('provider_body_too_large_no_dispatch', 413), { knownNoDispatch: true })
  return body
}
export function createSmokeResponsesTransport({ key, approved = false, fetchImpl = globalThis.fetch, now = () => performance.now(), maxAttempts = 1, buildBody = buildSmokeBody }) {
  if (!approved || typeof key !== 'string' || !key.trim()) throw new GateError('live_explicit_approval_required', 403)
  if (![1,8,20,100].includes(maxAttempts) || typeof buildBody !== 'function') throw new GateError('unsupported_transport_limits', 403)
  let attempted = 0
  return async (packet, signal) => {
    if (attempted >= maxAttempts) throw Object.assign(new GateError(maxAttempts === 1 ? 'transport_single_attempt_no_retry' : 'transport_attempt_limit_no_retry', 402), { knownNoDispatch: true })
    signal.throwIfAborted()
    const body = buildBody(packet)
    attempted += 1
    const combined = AbortSignal.any([signal, AbortSignal.timeout(smokePolicy.providerTimeoutMs)])
    const start = now()
    const abortable = async promise => {
      let listener
      const abort = new Promise((_, reject) => { listener = () => reject(new Error('aborted')); combined.addEventListener('abort', listener, { once: true }); if (combined.aborted) listener() })
      try { return await Promise.race([promise, abort]) } finally { combined.removeEventListener('abort', listener) }
    }
    let knownUsage
    try {
      const response = await abortable(fetchImpl(endpoint, { method: 'POST', redirect: 'error', signal: combined,
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))
      if (!response.ok || !response.body) throw new Error('provider_failure')
      const reader = response.body.getReader(); const chunks = []; let length = 0
      try {
        while (true) { combined.throwIfAborted(); const { value, done } = await abortable(reader.read()); if (done) break; length += value.byteLength; if (length > 65536) throw new Error('response_bound'); chunks.push(value) }
      } finally { void reader.cancel().catch(() => {}) }
      combined.throwIfAborted()
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (data.model !== smokePolicy.model || data.service_tier !== 'default') throw new Error('unverified_model_or_tier')
      const usage = { inputUnits: data.usage?.input_tokens, outputUnits: data.usage?.output_tokens }
      if (!Number.isSafeInteger(usage.inputUnits) || usage.inputUnits < 0 || usage.inputUnits > smokePolicy.maxInputTokens ||
        !Number.isSafeInteger(usage.outputUnits) || usage.outputUnits < 0 || usage.outputUnits > 256) throw new Error('unknown_usage')
      knownUsage = usage
      if (data.status !== 'completed' || data.error || data.incomplete_details) throw new Error('not_completed')
      if(!Array.isArray(data.output)||data.output.some(item=>item.type!=='message'||item.role!=='assistant'||!Array.isArray(item.content)||item.content.some(part=>!['output_text','refusal'].includes(part.type))))throw new Error('unexpected_response_item')
      const content = (data.output ?? []).filter(item => item.type === 'message' && item.role === 'assistant').flatMap(item => item.content ?? [])
      if (content.some(item => item.type === 'refusal')) throw new Error('refusal')
      const text = content.filter(item => item.type === 'output_text' && typeof item.text === 'string').map(item => item.text).join('\n').trim()
      if (!text || bytes(text) > smokePolicy.maxOutputBytes || text.includes(key)) throw new Error('invalid_dialogue')
      const costMicros = Math.ceil(usage.inputUnits * 0.75 + usage.outputUnits * 4.5)
      return { text, usage, measurement: { provider: 'openai', model: smokePolicy.model, status: 'completed', latencyMs: Math.max(0, Math.round(now() - start)),
        inputTokens: usage.inputUnits, outputTokens: usage.outputUnits, costMicros, currency: 'USD', ratesVerifiedOn: '2026-11-17' } }
    } catch {
      throw Object.assign(new GateError(knownUsage ? 'provider_failure_known_usage' : 'provider_outcome_unknown_held', 502), {
        ...(knownUsage ? { knownUsage } : {}), measurement: { latencyMs: Math.max(0, Math.round(now() - start)) } })
    }
  }
}
