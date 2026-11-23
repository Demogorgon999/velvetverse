// Versioned experimental ledger for the explicit mock-labels route and offline
// harnesses. Normal chat engines and live providers never invoke this module.
export type MemoryLabelV1 = {
  version: 1
  id: string
  sequence: number
  origin: { eventId: string; turnId: string }
  characterId: number
  storyScopeId: string
  conversationId: string
  factId: string
  provenance: 'observed' | 'user-claim' | 'unknown'
  visibility: 'provider-shared' | 'private' | 'character-only' | 'offscreen'
  observedBy: number[]
  status: 'active' | 'revoked'
  supersedesId: string | null
  summary: string
}
export type LabelLedgerV1 = { version: 1; events: MemoryLabelV1[] }
export type FixtureSerializationScope = {
  experimental: true
  fixtureOnly: true
  characterId: number
  storyScopeId: string
  maxRecords: number
  maxMemoryBytes: number
}
const prefix = 'velvetverse-experiment-labels-v1:'
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const char = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0
const eventFields = ['version', 'id', 'sequence', 'origin', 'characterId', 'storyScopeId', 'conversationId', 'factId', 'provenance', 'visibility', 'observedBy', 'status', 'supersedesId', 'summary']
const keysMatch = (value: Record<string, unknown>, fields: string[]) => Object.keys(value).length === fields.length && fields.every(field => Object.hasOwn(value, field))
const scopedId = (event: MemoryLabelV1, value = event.id) => JSON.stringify([event.characterId, event.storyScopeId, value])
const factKey = (event: MemoryLabelV1) => scopedId(event, event.factId)

export function validateLabelLedger(value: unknown): LabelLedgerV1 {
  if (!object(value) || !keysMatch(value, ['version', 'events']) || value.version !== 1 || !Array.isArray(value.events) || value.events.length > 128) {
    throw new Error('Invalid or unsupported experimental ledger; nothing may be serialized.')
  }
  const events: MemoryLabelV1[] = []
  const seen = new Set<string>()
  const currentFacts = new Map<string, MemoryLabelV1>()
  for (const raw of value.events) {
    if (!object(raw) || !keysMatch(raw, eventFields) || raw.version !== 1 || !id(raw.id) ||
      raw.sequence !== events.length + 1 || !object(raw.origin) || !keysMatch(raw.origin, ['eventId', 'turnId']) ||
      !id(raw.origin.eventId) || !id(raw.origin.turnId) || !char(raw.characterId) || !id(raw.storyScopeId) ||
      !id(raw.conversationId) || !id(raw.factId) || typeof raw.provenance !== 'string' || !['observed', 'user-claim', 'unknown'].includes(raw.provenance) ||
      typeof raw.visibility !== 'string' || !['provider-shared', 'private', 'character-only', 'offscreen'].includes(raw.visibility) ||
      !Array.isArray(raw.observedBy) || raw.observedBy.length > 16 || !raw.observedBy.every(char) ||
      new Set(raw.observedBy).size !== raw.observedBy.length || typeof raw.status !== 'string' || !['active', 'revoked'].includes(raw.status) ||
      !(raw.supersedesId === null || id(raw.supersedesId)) || typeof raw.summary !== 'string' ||
      raw.summary.length > 2048 || (raw.status === 'active' && !raw.summary.trim())) {
      throw new Error('Missing, ambiguous or malformed memory label; nothing may be serialized.')
    }
    const event = raw as unknown as MemoryLabelV1
    const identity = scopedId(event)
    if (seen.has(identity)) throw new Error('Duplicate scoped event label.')
    const prior = currentFacts.get(factKey(event))
    if ((prior && event.supersedesId !== prior.id) || (!prior && event.supersedesId !== null) ||
      (event.status === 'revoked' && !prior)) {
      throw new Error('Correction/revocation must link the current earlier ID in the same character/story scope.')
    }
    seen.add(identity)
    const clone = JSON.parse(JSON.stringify(event)) as MemoryLabelV1
    events.push(clone)
    currentFacts.set(factKey(clone), clone)
  }
  return { version: 1, events }
}

export function appendMemoryLabel(ledger: unknown, event: unknown): LabelLedgerV1 {
  const valid = validateLabelLedger(ledger)
  return validateLabelLedger({ version: 1, events: [...valid.events, event] })
}

export function saveExperimentalLabels(storage: Pick<Storage, 'setItem'>, key: string, ledger: unknown) {
  if (!key.startsWith(prefix) || !id(key.slice(prefix.length))) throw new Error('Only an explicit experimental storage key is allowed.')
  storage.setItem(key, JSON.stringify(validateLabelLedger(ledger)))
}

export function reloadExperimentalLabels(storage: Pick<Storage, 'getItem'>, key: string): LabelLedgerV1 {
  if (!key.startsWith(prefix) || !id(key.slice(prefix.length))) throw new Error('Regular or unspecified memory stores cannot be loaded.')
  const saved = storage.getItem(key)
  if (saved === null) throw new Error('No experimental ledger. Legacy stores are never inferred or migrated.')
  return validateLabelLedger(JSON.parse(saved))
}

export function serializeFixtureMemoryLabels(ledger: unknown, scope: FixtureSerializationScope): string {
  if (scope.experimental !== true || scope.fixtureOnly !== true || !char(scope.characterId) || !id(scope.storyScopeId) ||
    !Number.isSafeInteger(scope.maxRecords) || scope.maxRecords < 0 || scope.maxRecords > 16 ||
    !Number.isSafeInteger(scope.maxMemoryBytes) || scope.maxMemoryBytes < 2 || scope.maxMemoryBytes > 8192) {
    throw new Error('Explicit experimental, fixture-only serialization and valid bounded scope are required.')
  }
  const valid = validateLabelLedger(ledger)
  const latest = new Map<string, MemoryLabelV1>()
  for (const event of valid.events) {
    if (event.characterId === scope.characterId && event.storyScopeId === scope.storyScopeId) latest.set(event.factId, event)
  }
  const memories: { id: string; eventId: string; turnId: string; summary: string }[] = []
  const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength
  for (const event of [...latest.values()].sort((a, b) => b.sequence - a.sequence)) {
    // These labels are supplied explicitly at capture time, never inferred from text.
    if (event.status !== 'active' || event.provenance !== 'observed' || event.visibility !== 'provider-shared' ||
      !event.observedBy.includes(scope.characterId)) continue
    const projected = { id: event.id, eventId: event.origin.eventId, turnId: event.origin.turnId, summary: event.summary }
    if (memories.length < scope.maxRecords && bytes([...memories, projected]) <= scope.maxMemoryBytes) memories.push(projected)
  }
  return JSON.stringify({ version: 1, mode: 'fixture-only-experimental-memory-labels', characterId: scope.characterId,
    storyScopeId: scope.storyScopeId, memories })
}
