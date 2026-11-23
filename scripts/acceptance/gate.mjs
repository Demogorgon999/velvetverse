import { mkdirSync, existsSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, readFileSync, unlinkSync } from 'node:fs'
import { dirname } from 'node:path'
import { createHash } from 'node:crypto'

export class GateError extends Error {
  constructor(code, status = 409) { super(code); this.code = code; this.status = status }
}
export function validateMockPolicy(policy) {
  const integer = (name, min, max) => Number.isSafeInteger(policy?.[name]) && policy[name] >= min && policy[name] <= max
  if (policy?.provider !== 'injected-fake-only' || policy.ratesKind !== 'synthetic-test-only' ||
    !integer('capMicros', 1, 25_000_000) || !integer('creditCeilingMicros', 1, 25_000_000) ||
    policy.capMicros > policy.creditCeilingMicros || !integer('headroomMicros', 1, policy.capMicros - 1) ||
    !integer('fakeInputUnitMicros', 1, 1000) || !integer('fakeOutputUnitMicros', 1, 1000) ||
    !integer('maxInputBytes', 256, 16384) || !integer('maxOutputBytes', 128, 2048) || !integer('timeoutMs', 10, 30000) ||
    !Number.isFinite(Date.parse(policy.expiresAt)) || !Array.isArray(policy.testerIds) || !policy.testerIds.length ||
    !policy.testerIds.every(id => /^[a-z0-9-]{1,32}$/.test(id))) throw new GateError('missing_or_invalid_mock_budget', 503)
  return JSON.parse(JSON.stringify(policy))
}
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
export const scopeKey = scope => JSON.stringify([scope.testerId, scope.storyId, scope.characterId])

export class PersistentMockGate {
  constructor(path, policy, { now = () => Date.now(), validatePolicy = validateMockPolicy } = {}) {
    this.path = path; this.policy = validatePolicy(policy); this.now = now; this.queue = Promise.resolve(); this.closed = false
    mkdirSync(dirname(path), { recursive: true })
    this.lockPath = path + '.owner-lock'
    try { this.lockFd = openSync(this.lockPath, 'wx'); writeFileSync(this.lockFd, String(process.pid)); fsyncSync(this.lockFd) }
    catch { throw new GateError('ledger_locked_fail_closed', 503) }
    try {
      if (existsSync(path)) {
        this.data = JSON.parse(readFileSync(path, 'utf8'))
        if (this.data.version !== 1 || this.data.policyHash !== digest(this.policy) || !this.data.entries || typeof this.data.entries !== 'object' || Array.isArray(this.data.entries) || !this.data.saves || typeof this.data.saves !== 'object' || Array.isArray(this.data.saves) ||
          !Number.isSafeInteger(this.data.spentMicros) || this.data.spentMicros < 0 || typeof this.data.testClosed !== 'boolean') throw new Error('invalid')
        for (const entry of Object.values(this.data.entries)) {
          if (!['reserved', 'held', 'complete', 'known-failure'].includes(entry.status) || !Number.isSafeInteger(entry.reservedMicros) || entry.reservedMicros < 0) throw new Error('invalid')
          if (entry.status === 'reserved') { entry.status = 'held'; entry.reason = 'restart_uncertain' }
        }
      } else this.data = { version: 1, policyHash: digest(this.policy), spentMicros: 0, testClosed: false, entries: {}, saves: {} }
      this.persist()
    } catch { this.releaseLock(); throw new GateError('invalid_ledger_fail_closed', 503) }
  }
  releaseLock() { if (this.lockFd !== undefined) { closeSync(this.lockFd); this.lockFd = undefined; unlinkSync(this.lockPath) } }
  persist() {
    const temp = this.path + '.next'
    const fd = openSync(temp, 'w')
    try { writeFileSync(fd, JSON.stringify(this.data)); fsyncSync(fd) } finally { closeSync(fd) }
    renameSync(temp, this.path)
  }
  atomic(fn) {
    const result = this.queue.then(() => {
      if (this.closed) throw new GateError('gate_stopped', 503)
      const before = structuredClone(this.data)
      try { return fn() } catch (error) { this.data = before; throw error }
    })
    this.queue = result.catch(() => {})
    return result
  }
  active() {
    if (this.data.testClosed) throw new GateError('test_closed', 403)
    if (this.now() >= Date.parse(this.policy.expiresAt)) throw new GateError('test_expired', 403)
  }
  reservationMicros() { return this.policy.maxInputBytes * this.policy.fakeInputUnitMicros + this.policy.maxOutputBytes * this.policy.fakeOutputUnitMicros }
  validUsage(usage) { return usage && Number.isSafeInteger(usage.inputUnits) && usage.inputUnits >= 0 && usage.inputUnits <= this.policy.maxInputBytes && Number.isSafeInteger(usage.outputUnits) && usage.outputUnits >= 0 && usage.outputUnits <= this.policy.maxOutputBytes }
  chargeUsage(usage) { return usage.inputUnits * this.policy.fakeInputUnitMicros + usage.outputUnits * this.policy.fakeOutputUnitMicros }
  checkAttemptLimit() { /* Fake mode keeps its existing budget behavior. */ }
  recordMeasurement() { /* Live-only sanitized telemetry hook. */ }
  validateScope(scope) {
    if (!this.policy.testerIds.includes(scope?.testerId) || !/^[a-z0-9-]{1,40}$/.test(scope.storyId) || ![1, 2].includes(scope.characterId)) throw new GateError('invalid_fictional_scope', 400)
  }
  summary() {
    const heldMicros = Object.values(this.data.entries).filter(entry => ['reserved', 'held'].includes(entry.status)).reduce((sum, entry) => sum + entry.reservedMicros, 0)
    return { kind: 'SYNTHETIC TEST UNITS - NOT PRICES OR ACTUAL CREDIT', capMicros: this.policy.capMicros,
      headroomMicros: this.policy.headroomMicros, spentMicros: this.data.spentMicros, heldMicros,
      availableMicros: Math.max(0, this.policy.capMicros - this.policy.headroomMicros - this.data.spentMicros - heldMicros),
      testClosed: this.data.testClosed, expired: this.now() >= Date.parse(this.policy.expiresAt), expiresAt: this.policy.expiresAt }
  }
  getSave(scope) { this.validateScope(scope); return structuredClone(this.data.saves[scopeKey(scope)] ?? { state: {}, transcript: [], labels: { version: 1, events: [] }, conversation: 1 }) }
  updateSave(scope, mutate) {
    return this.atomic(() => {
      this.active(); this.validateScope(scope)
      if (Object.values(this.data.entries).some(entry => entry.scopeKey === scopeKey(scope) && ['reserved', 'held'].includes(entry.status))) throw new GateError('scope_busy_or_held')
      const next = mutate(this.getSave(scope)); this.data.saves[scopeKey(scope)] = structuredClone(next); this.persist(); return next
    })
  }
  async execute(scope, requestId, input, transport, context = null) {
    this.validateScope(scope)
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(requestId) || new TextEncoder().encode(JSON.stringify(input)).byteLength > this.policy.maxInputBytes) throw new GateError('invalid_or_oversized_turn', 413)
    const identity = JSON.stringify([scopeKey(scope), requestId]); const hash = digest(input)
    const reservation = this.reservationMicros()
    const decision = await this.atomic(() => {
      const prior = this.data.entries[identity]
      if (prior) {
        if (prior.inputHash !== hash) throw new GateError('idempotency_conflict')
        if (prior.status === 'complete') return { replay: true, response: structuredClone(prior.response) }
        throw new GateError(prior.status === 'known-failure' ? 'previous_known_failure_no_retry' : 'request_pending_or_held')
      }
      this.active()
      this.checkAttemptLimit(context, scope)
      if (Object.values(this.data.entries).some(entry => entry.scopeKey === scopeKey(scope) && ['reserved', 'held'].includes(entry.status))) throw new GateError('scope_busy_or_held')
      if (reservation > this.summary().availableMicros) throw new GateError('mock_budget_exhausted', 402)
      this.data.entries[identity] = { status: 'reserved', scopeKey: scopeKey(scope), requestId, inputHash: hash, reservedMicros: reservation, createdAt: this.now() }
      if (/^[a-f0-9]{32}$/.test(context?.sessionTag ?? '')) this.data.entries[identity].sessionTag = context.sessionTag
      this.persist() // Durable reservation before any transport work.
      return { replay: false, save: this.getSave(scope) }
    })
    if (decision.replay) return { ...decision.response, replay: true }
    const controller = new AbortController()
    let deadline
    try {
      const timeout = new Promise((_, reject) => { deadline = setTimeout(() => { controller.abort(); reject(new GateError('ambiguous_timeout_held', 504)) }, this.policy.timeoutMs) })
      const result = await Promise.race([Promise.resolve().then(() => transport({ scope, input, save: decision.save, signal: controller.signal, requestId })), timeout])
      const usage = result?.usage
      if (!this.validUsage(usage) ||
        typeof result.reply !== 'string' || new TextEncoder().encode(result.reply).byteLength > this.policy.maxOutputBytes) throw new GateError('unknown_or_out_of_bounds_usage_held', 502)
      return await this.atomic(() => {
        const entry = this.data.entries[identity]
        const charge = this.chargeUsage(usage)
        this.data.spentMicros += charge
        entry.status = 'complete'; entry.usage = usage; entry.chargeMicros = charge; entry.reservedMicros = 0
        this.recordMeasurement(entry, result.measurement)
        const response = { reply: result.reply, capture: result.capture, engineReceipt: result.engineReceipt, usage, measurement: result.measurement, budget: null }
        this.data.saves[scopeKey(scope)] = structuredClone(result.save)
        response.budget = this.summary(); entry.response = response; this.persist()
        return structuredClone(response)
      })
    } catch (error) {
      let failureCode = 'ambiguous_failure_held'
      await this.atomic(() => {
        const entry = this.data.entries[identity]
        const known = error?.knownUsage
        if (this.validUsage(known)) {
          const charge = this.chargeUsage(known)
          this.data.spentMicros += charge; entry.status = 'known-failure'; entry.reservedMicros = 0; entry.usage = known; entry.chargeMicros = charge
          failureCode = 'known_usage_failure_reconciled'
        } else if (error?.knownNoDispatch === true) { entry.status = 'known-failure'; entry.reservedMicros = 0; failureCode = 'known_pre_dispatch_failure' }
        else { entry.status = 'held'; entry.reason = error?.code ?? 'unknown_failure' }
        this.recordMeasurement(entry, error?.measurement)
        this.persist()
      })
      throw error instanceof GateError ? error : new GateError(failureCode, 502)
    } finally { clearTimeout(deadline) }
  }
  closeTest() { return this.atomic(() => { this.data.testClosed = true; this.persist(); return this.summary() }) }
  async close() {
    await this.queue
    if(this.closed)return
    this.closed = true
    try{for(const entry of Object.values(this.data.entries))if(entry.status==='reserved')entry.status='held';this.persist()}
    finally{this.releaseLock()} // A failed final write must not keep our handle alive.
  }
}
