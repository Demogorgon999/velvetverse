import assert from 'node:assert/strict'
import { appendMemoryLabel, saveExperimentalLabels, reloadExperimentalLabels, serializeFixtureMemoryLabels } from '../src/experimental/memoryLabels.ts'

globalThis.fetch = () => { throw new Error('Offline memory label demo blocks network.') }
const scope = { experimental: true, fixtureOnly: true, characterId: 1, storyScopeId: 'fictional-story', maxRecords: 3, maxMemoryBytes: 600 }
const event = (id, sequence, summary, extra = {}) => ({ version: 1, id, sequence, origin: { eventId: `event-${sequence}`, turnId: `turn-${sequence}` },
  characterId: 1, storyScopeId: 'fictional-story', conversationId: 'conversation-one', factId: 'meeting',
  provenance: 'observed', visibility: 'provider-shared', observedBy: [1], status: 'active', supersedesId: null, summary, ...extra })
let ledger = { version: 1, events: [] }
const store = new Map()
const storage = { setItem: (key, value) => store.set(key, value), getItem: key => store.get(key) ?? null }
const storageKey = 'velvetverse-experiment-labels-v1:fictional-demo'
const rows = []
const capture = name => {
  saveExperimentalLabels(storage, storageKey, ledger)
  ledger = reloadExperimentalLabels(storage, storageKey)
  const packet = serializeFixtureMemoryLabels(ledger, scope)
  rows.push({ step: name, packet: JSON.parse(packet), mock: true })
  return packet
}
ledger = appendMemoryLabel(ledger, event('meeting-original', 1, 'The meeting is at North Gate.'))
assert.ok(capture('original and reload').includes('North Gate'))
ledger = appendMemoryLabel(ledger, event('meeting-corrected', 2, 'The meeting moved to the mill.', { supersedesId: 'meeting-original', conversationId: 'conversation-two' }))
const corrected = capture('explicit correction and same-story continuation reload')
assert.ok(corrected.includes('mill')); assert.equal(corrected.includes('North Gate'), false)
ledger = appendMemoryLabel(ledger, event('hidden-local', 3, 'AMBER LARK hidden thought.', { factId: 'private-thought', visibility: 'private', observedBy: [] }))
ledger = appendMemoryLabel(ledger, event('other-scope', 4, 'COPPER isolated profile.', { storyScopeId: 'isolated-story', factId: 'nickname' }))
const scoped = capture('private and isolated facts excluded after reload')
assert.equal(scoped.includes('AMBER LARK'), false); assert.equal(scoped.includes('COPPER'), false)
ledger = appendMemoryLabel(ledger, event('meeting-revoked', 5, '', { status: 'revoked', supersedesId: 'meeting-corrected' }))
const revoked = capture('revocation survives reload')
assert.equal(JSON.parse(revoked).memories.length, 0)
let legacyBlocked = false
try { serializeFixtureMemoryLabels({ experiences: [{ summary: 'Unlabelled legacy fact.' }] }, scope) }
catch { legacyBlocked = true }
assert.equal(legacyBlocked, true)
console.log('OFFLINE STANDALONE MEMORY LABELS V1 - NO APP MIGRATION OR MODEL QUALITY TEST')
console.table(rows.map(row => ({ step: row.step, allowedIds: row.packet.memories.map(memory => memory.id).join(', ') || '(none)', mock: row.mock })))
console.log('PASS=4 captured reload steps; EXPECTED_BLOCK=1 legacy snapshot; FAIL=0. Persistence here is an isolated in-memory adapter round-trip, not browser app integration.')
if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2))
