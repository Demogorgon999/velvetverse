// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { appendMemoryLabel, validateLabelLedger, saveExperimentalLabels, reloadExperimentalLabels, serializeFixtureMemoryLabels } from '../src/experimental/memoryLabels'
import type { MemoryLabelV1, LabelLedgerV1, FixtureSerializationScope } from '../src/experimental/memoryLabels'
import { captureMockProvider } from '../scripts/memory-evaluation/runner.mjs'

const scope: FixtureSerializationScope = { experimental: true, fixtureOnly: true, characterId: 1, storyScopeId: 'story-one', maxRecords: 3, maxMemoryBytes: 600 }
const event = (id: string, sequence: number, summary: string, extra: Partial<MemoryLabelV1> = {}): MemoryLabelV1 => ({
  version: 1, id, sequence, origin: { eventId: `event-${sequence}`, turnId: `turn-${sequence}` }, characterId: 1,
  storyScopeId: 'story-one', conversationId: 'conversation-one', factId: 'meeting', provenance: 'observed',
  visibility: 'provider-shared', observedBy: [1], status: 'active', supersedesId: null, summary, ...extra,
})
const empty = (): LabelLedgerV1 => ({ version: 1, events: [] })
function reload(ledger: unknown) {
  const map = new Map<string, string>()
  const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value) } }
  saveExperimentalLabels(storage, 'velvetverse-experiment-labels-v1:test', ledger)
  return reloadExperimentalLabels(storage, 'velvetverse-experiment-labels-v1:test')
}
function capture(ledger: unknown, current = scope) {
  const packet = serializeFixtureMemoryLabels(reload(ledger), current)
  const captures: { serialized: string }[] = []
  captureMockProvider('C', captures)(packet)
  return captures[0].serialized
}

describe('standalone explicit memory labels v1', () => {
  it('preserves event/turn provenance and an explicit correction across reload and captured serialization', () => {
    const original = appendMemoryLabel(empty(), event('old', 1, 'OLD_GATE North Gate.'))
    const corrected = appendMemoryLabel(original, event('new', 2, 'LATEST_MILL meeting at the mill.', { supersedesId: 'old', conversationId: 'conversation-two' }))
    const packet = capture(corrected)
    expect(packet).toContain('LATEST_MILL')
    expect(packet).not.toContain('OLD_GATE')
    const content = JSON.parse(JSON.parse(packet).input[0].content)
    expect(content.memories).toEqual([{ id: 'new', eventId: 'event-2', turnId: 'turn-2', summary: 'LATEST_MILL meeting at the mill.' }])
    expect(original.events).toHaveLength(1)
    expect(corrected.events[1].supersedesId).toBe('old')
  })

  it.each(['private', 'character-only', 'offscreen'] as const)('never resurrects an older shared fact after a %s correction', visibility => {
    let ledger = appendMemoryLabel(empty(), event('old', 1, 'OLD_SHARED_SECRET'))
    ledger = appendMemoryLabel(ledger, event('hidden', 2, 'NEW_PRIVATE_SECRET', { supersedesId: 'old', visibility }))
    const packet = capture(ledger)
    expect(packet).not.toContain('OLD_SHARED_SECRET')
    expect(packet).not.toContain('NEW_PRIVATE_SECRET')
  })

  it('keeps revocation effective after reload without rewriting original records', () => {
    let ledger = appendMemoryLabel(empty(), event('old', 1, 'Revocable shared fact.'))
    ledger = appendMemoryLabel(ledger, event('revoked', 2, '', { supersedesId: 'old', status: 'revoked' }))
    expect(ledger.events[0].summary).toBe('Revocable shared fact.')
    const packet = capture(ledger)
    expect(packet).not.toContain('Revocable')
    expect(JSON.parse(JSON.parse(packet).input[0].content).memories).toHaveLength(0)
  })

  it('preserves explicitly scoped same-story continuation and excludes unrelated characters/stories with identical local ids', () => {
    let ledger = appendMemoryLabel(empty(), event('local', 1, 'SHARED_STORY continuity.'))
    ledger = appendMemoryLabel(ledger, event('local', 2, 'OTHER_STORY Copper.', { storyScopeId: 'story-two' }))
    ledger = appendMemoryLabel(ledger, event('local', 3, 'OTHER_CHARACTER secret.', { characterId: 2, observedBy: [2] }))
    ledger = appendMemoryLabel(ledger, event('later', 4, 'SAME_STORY later chapter.', { supersedesId: 'local', conversationId: 'conversation-two' }))
    const packet = capture(ledger)
    expect(packet).toContain('SAME_STORY')
    expect(packet).not.toContain('SHARED_STORY')
    expect(packet).not.toContain('OTHER_STORY')
    expect(packet).not.toContain('OTHER_CHARACTER')
  })

  it.each([
    { provenance: 'unknown' as const }, { provenance: 'user-claim' as const }, { observedBy: [] }, { observedBy: [2] },
  ])('does not promote unknown provenance or unwitnessed claims: %s', labels => {
    const ledger = appendMemoryLabel(empty(), event('unverified', 1, 'UNVERIFIED_RESCUE Captain Venn.', labels))
    expect(capture(ledger)).not.toContain('UNVERIFIED_RESCUE')
  })

  it.each(['version', 'origin', 'characterId', 'storyScopeId', 'conversationId', 'factId', 'provenance', 'visibility', 'observedBy', 'status', 'supersedesId'])('rejects missing %s metadata rather than labelling legacy content', field => {
    const raw = { ...event('a', 1, 'Ambiguous record.'), [field]: undefined }
    expect(() => appendMemoryLabel(empty(), raw)).toThrow()
    expect(() => serializeFixtureMemoryLabels({ experiences: [raw] }, scope)).toThrow()
  })

  it.each([
    { version: 2 }, { provenance: ['observed'] }, { visibility: ['provider-shared'] }, { observedBy: [1, 1] },
    { sequence: 2 }, { origin: { eventId: 'event-only' } }, { extraPermission: true },
  ])('rejects malformed or unknown-version metadata: %s', invalid => {
    expect(() => appendMemoryLabel(empty(), { ...event('a', 1, 'Malformed.'), ...invalid })).toThrow()
  })

  it('rejects dangling, cross-fact, duplicate and out-of-order correction links', () => {
    const ledger = appendMemoryLabel(empty(), event('old', 1, 'Original.'))
    expect(() => appendMemoryLabel(ledger, event('new', 2, 'Wrong link.', { supersedesId: 'missing' }))).toThrow('link')
    expect(() => appendMemoryLabel(ledger, event('new', 2, 'Wrong fact.', { supersedesId: 'old', factId: 'another' }))).toThrow('link')
    expect(() => appendMemoryLabel(ledger, event('old', 2, 'Duplicate.', { supersedesId: 'old' }))).toThrow('Duplicate')
    expect(() => validateLabelLedger({ version: 1, events: [event('later', 2, 'Later.'), event('earlier', 1, 'Earlier.')] })).toThrow()
  })

  it('never touches regular memory stores or silently migrates missing experimental stores', () => {
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn() }
    expect(() => reloadExperimentalLabels(storage, 'velvetverse-memory-1')).toThrow()
    expect(() => saveExperimentalLabels(storage, 'velvetverse-memory-1', empty())).toThrow()
    expect(storage.getItem).not.toHaveBeenCalled()
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(() => reloadExperimentalLabels(storage, 'velvetverse-experiment-labels-v1:missing')).toThrow('Legacy')
  })

  it('requires explicit fixture-only opt-in, bounds the payload and uses deterministic capture order', () => {
    let ledger = appendMemoryLabel(empty(), event('one', 1, 'First shared fact.'))
    ledger = appendMemoryLabel(ledger, event('two', 2, 'Second shared fact.', { factId: 'second' }))
    expect(() => serializeFixtureMemoryLabels(ledger, { ...scope, experimental: false } as unknown as FixtureSerializationScope)).toThrow('fixture-only')
    expect(() => serializeFixtureMemoryLabels(ledger, { ...scope, fixtureOnly: false } as unknown as FixtureSerializationScope)).toThrow('fixture-only')
    const first = capture(ledger, { ...scope, maxRecords: 1 })
    expect(first).toBe(capture(reload(ledger), { ...scope, maxRecords: 1 }))
    expect(first).toContain('Second shared fact.')
    expect(first).not.toContain('First shared fact.')
    const zero = serializeFixtureMemoryLabels(ledger, { ...scope, maxRecords: 0 })
    expect(JSON.parse(zero).memories).toHaveLength(0)
  })
})
