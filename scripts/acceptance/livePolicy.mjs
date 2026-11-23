import { PersistentMockGate, GateError } from './gate.mjs'

export const smokePolicy = Object.freeze({ provider: 'openai-owner-smoke', ratesKind: 'verified-standard-token-rates',
  model: 'gpt-5.4-mini-2026-03-17', capMicros: 50000, creditCeilingMicros: 50000, headroomMicros: 40000,
  inputMicrosPerToken: 0.75, outputMicrosPerToken: 4.5, maxRequests: 1,
  maxInputBytes: 8192, maxInputTokens: 8704, maxOutputTokens: 256, maxOutputBytes: 2048,
  timeoutMs: 25000, providerTimeoutMs: 20000, expiresAt: '2026-11-24T23:00:00.000Z', testerIds: ['fictional-a'] })
export function validateLivePolicy(policy) {
  if (JSON.stringify(policy) !== JSON.stringify(smokePolicy)) throw new GateError('unsupported_live_policy', 503)
  return structuredClone(smokePolicy)
}
export function validateOwnerApproval(value, now = Date.now()) {
  if (!value || Object.keys(value).some(key => !['key', 'confirmation', 'promoRemainingUsd', 'promoExpiresAt', 'noPaidBilling', 'startupNonce'].includes(key)) ||
    value.confirmation !== 'ONE LOCAL SYNTHETIC SCENE' || value.noPaidBilling !== true ||
    !Number.isFinite(value.promoRemainingUsd) || value.promoRemainingUsd < 0.05 ||
    !Number.isFinite(Date.parse(value.promoExpiresAt)) || Date.parse(value.promoExpiresAt) <= now + 30 * 60000 ||
    now >= Date.parse(smokePolicy.expiresAt) || typeof value.key !== 'string' || !/^[\x21-\x7e]{1,512}$/.test(value.key)) {
    throw new GateError('owner_credit_confirmation_required', 403)
  }
  return { sessionExpiresAt: Math.min(now + 30 * 60000, Date.parse(value.promoExpiresAt), Date.parse(smokePolicy.expiresAt)) }
}
export class PersistentLiveSmokeGate extends PersistentMockGate {
  constructor(path, { now = () => Date.now(), sessionExpiresAt } = {}) {
    if (!Number.isFinite(sessionExpiresAt) || sessionExpiresAt <= now() || sessionExpiresAt > now() + 30 * 60000) throw new GateError('live_session_approval_expired', 403)
    super(path, smokePolicy, { now, validatePolicy: validateLivePolicy })
    this.sessionExpiresAt = sessionExpiresAt
  }
  active() { super.active(); if (this.now() >= this.sessionExpiresAt) throw new GateError('live_session_expired', 403) }
  validateScope(scope) { super.validateScope(scope); if (scope.characterId !== 1) throw new GateError('seraphina_smoke_only', 400) }
  checkAttemptLimit() { if (Object.keys(this.data.entries).length >= 1) throw new GateError('one_smoke_attempt_already_reserved_no_retry', 402) }
  reservationMicros() { return Math.ceil(this.policy.maxInputTokens * this.policy.inputMicrosPerToken + this.policy.maxOutputTokens * this.policy.outputMicrosPerToken) }
  validUsage(usage) { return usage && Number.isSafeInteger(usage.inputUnits) && usage.inputUnits >= 0 && usage.inputUnits <= this.policy.maxInputTokens && Number.isSafeInteger(usage.outputUnits) && usage.outputUnits >= 0 && usage.outputUnits <= this.policy.maxOutputTokens }
  chargeUsage(usage) { return Math.ceil(usage.inputUnits * this.policy.inputMicrosPerToken + usage.outputUnits * this.policy.outputMicrosPerToken) }
  recordMeasurement(entry, value) {
    entry.measurement = { status: entry.status, model: this.policy.model,
      latencyMs: Number.isSafeInteger(value?.latencyMs) && value.latencyMs >= 0 && value.latencyMs <= 60000 ? value.latencyMs : null,
      inputTokens: entry.usage?.inputUnits ?? null, outputTokens: entry.usage?.outputUnits ?? null, costMicros: entry.chargeMicros ?? null }
  }
  summary() { return { ...super.summary(), kind: 'LIVE OWNER SMOKE - USD MICROS, ONE ATTEMPT', providerMode: 'openai-owner-smoke',
    attemptsRemaining: Math.max(0, 1 - Object.keys(this.data.entries).length), expired: this.now() >= Math.min(this.sessionExpiresAt ?? Infinity, Date.parse(this.policy.expiresAt)),
    sessionExpiresAt: this.sessionExpiresAt, model: this.policy.model,
    lastOutcome: Object.values(this.data.entries).at(-1)?.measurement ?? null } }
}
