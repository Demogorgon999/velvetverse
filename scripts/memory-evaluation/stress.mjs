import assert from 'node:assert/strict'
import { context, memory } from './fixtures.mjs'
import { selectCandidate, serializePacket } from './selector.mjs'
import { captureMockProvider, selectActualBaseline } from './runner.mjs'

function shuffled(records, seed) {
  const result = [...records]
  let state = seed >>> 0
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
const fact = (id, summary, extra = {}) => memory(id, summary, extra)
export const stressCases = [
  { id: 'unknown-provenance', records: [fact('safe', 'Bridge closed.'), fact('unknown', 'UNKNOWN_ORIGIN bridge.', { source: 'unknown' }), fact('missing', 'MISSING_ORIGIN bridge.', { source: undefined })], query: 'bridge', expected: ['safe'], forbidden: ['UNKNOWN_ORIGIN', 'MISSING_ORIGIN'] },
  { id: 'missing-visibility-latest', records: [fact('old', 'OLD_ACCESS bridge code.', { factKey: 'code' }), fact('new', 'New restricted bridge code.', { factKey: 'code', revision: 2, visibility: undefined })], query: 'bridge code', expected: [], forbidden: ['OLD_ACCESS'] },
  { id: 'conflicting-correction-shuffled', records: [fact('old', 'OLD_GATE meeting North Gate.', { factKey: 'meeting', importance: 100 }), fact('new', 'Meeting at the mill.', { factKey: 'meeting', revision: 3 }), fact('middle', 'OLD_DOCK meeting dock.', { factKey: 'meeting', revision: 2 })], query: 'meeting North Gate dock', expected: ['new'], forbidden: ['OLD_GATE', 'OLD_DOCK'] },
  { id: 'same-local-id-different-scopes', records: [fact('local-1', 'Seraphina bridge is closed.'), fact('local-1', 'FOREIGN_CHARACTER Seraphina bridge is open.', { characterId: 2 }), fact('local-1', 'ISOLATED_PROFILE bridge is open.', { chatId: 'isolated-profile' }), fact('local-1', 'STRING_ID bridge is open.', { characterId: '1' })], query: 'Seraphina bridge', expected: ['local-1'], forbidden: ['FOREIGN_CHARACTER', 'ISOLATED_PROFILE', 'STRING_ID'] },
  { id: 'visibility-changed-private', records: [fact('old', 'RETIRED_CODE tower code.', { factKey: 'code' }), fact('new', 'PRIVATE_CODE tower code.', { factKey: 'code', revision: 2, visibility: 'private' })], query: 'tower code', expected: [], forbidden: ['RETIRED_CODE', 'PRIVATE_CODE'] },
  { id: 'explicit-revocation', records: [fact('old', 'REVOKED_CODE tower code.', { factKey: 'code' }), fact('revoked', 'Tower access revoked.', { factKey: 'code', revision: 2, revoked: true })], query: 'tower code access', expected: [], forbidden: ['REVOKED_CODE', 'access revoked'] },
  { id: 'oversized-memory-skipped', records: [fact('large', 'bridge '.repeat(1000), { importance: 100 }), fact('small', 'Bridge closed.')], query: 'bridge', expected: ['small'], forbidden: ['bridge bridge bridge'] },
  { id: 'zero-record-budget', records: [fact('safe', 'Bridge closed.')], query: 'bridge', expected: [], context: { ...context, maxMemories: 0 }, forbidden: ['Bridge closed.'] },
  { id: 'duplicates-do-not-take-slots', records: [fact('d1', 'The tower key is brass.', { factKey: 'key' }), fact('d2', 'Their brass key opens the tower.', { factKey: 'key' }), fact('useful2', 'A lantern lights the tower.')], query: 'tower key lantern', expected: ['d1', 'useful2'], context: { ...context, maxMemories: 2 }, forbidden: ['Their brass key opens'] },
  { id: 'permitted-character-continuity', records: [fact('earlier', 'CONTINUITY_OK: They folded a paper boat by the river.', { chatId: 'chapter-before' }), fact('isolated', 'ISOLATED_PROFILE Copper is the traveler.', { chatId: 'isolated-profile' })], query: 'river paper boat', expected: ['earlier'], context: { ...context, allowedChatIds: ['chapter-before'] }, forbidden: ['ISOLATED_PROFILE', 'Copper'] },
  { id: 'stale-derived-summary', records: [fact('old-plan', 'OLD_PLAN meeting at gate.', { factKey: 'plan', revision: 1 }), fact('new-plan', 'The meeting moved to the mill.', { factKey: 'plan', revision: 2 }), fact('summary', 'STALE_SUMMARY meeting gate plan.', { importance: 100, emotionalWeight: 100, derivedFrom: [{ factKey: 'plan', revision: 1 }] })], query: 'meeting gate plan', expected: ['new-plan'], forbidden: ['OLD_PLAN', 'STALE_SUMMARY'] },
  { id: 'oversized-query-blocked', records: [], query: 'q'.repeat(4097), blocked: true },
  { id: 'too-many-records-blocked', records: Array.from({ length: 257 }, (_, i) => fact('record-' + i, 'Bridge closed.')), query: 'bridge', blocked: true },
  { id: 'zero-byte-budget-blocked', records: [], query: 'bridge', context: { ...context, maxMemoryBytes: 0 }, blocked: true },
]

function capturedPacket(records, currentContext, query, forbidden = []) {
  const selection = selectCandidate(records, currentContext, query)
  const packet = serializePacket(currentContext, query, selection.selected)
  const captures = []
  captureMockProvider('A/B', captures)(packet)
  captureMockProvider('C', captures)(packet)
  const decodedB = JSON.parse(captures[0].serialized).messages[0].content
  const decodedC = JSON.parse(captures[1].serialized).input[0].content
  assert.equal(decodedB, decodedC)
  for (const marker of forbidden) {
    for (const capture of captures) assert.equal(capture.serialized.includes(marker), false, `Forbidden ${marker}`)
  }
  return { packet: decodedB, ids: selection.selected.map(record => record.id) }
}

export function runStressEvaluation() {
  const rows = []
  for (const testCase of stressCases) {
    const current = testCase.context ?? context
    if (testCase.blocked) {
      assert.throws(() => capturedPacket(testCase.records, current, testCase.query), /limit|budget/)
      rows.push({ id: testCase.id, status: 'EXPECTED BLOCK', packet: null, baselineIds: null, perturbations: 0 })
      continue
    }
    const first = capturedPacket(testCase.records, current, testCase.query, testCase.forbidden)
    assert.deepEqual([...first.ids].sort(), [...testCase.expected].sort(), testCase.id)
    for (let seed = 1337; seed < 1369; seed += 1) {
      const perturbed = capturedPacket(shuffled(testCase.records, seed), current, testCase.query, testCase.forbidden)
      assert.equal(perturbed.packet, first.packet, `${testCase.id} seed ${seed}`)
    }
    rows.push({ id: testCase.id, status: 'PASS', packet: first.packet, selectedIds: first.ids,
      baselineIds: selectActualBaseline(testCase.records).map(record => record.id), perturbations: 32 })
  }
  // Simulated fixture serialization/reload sequence, not actual app persistence.
  let records = [fact('plan-1', 'The meeting is at North Gate.', { factKey: 'plan' })]
  const turns = []
  turns.push(capturedPacket(records, context, 'meeting'))
  records.push(fact('plan-2', 'The meeting moved to the mill.', { factKey: 'plan', revision: 2 }))
  records = JSON.parse(JSON.stringify(records))
  turns.push(capturedPacket(records, context, 'meeting', ['North Gate']))
  turns.push(capturedPacket(records, context, 'meeting', ['North Gate']))
  assert.equal(turns[1].packet, turns[2].packet)
  records.push(fact('plan-3', 'PRIVATE_FINAL meeting place.', { factKey: 'plan', revision: 3, visibility: 'offscreen' }))
  turns.push(capturedPacket(records, context, 'meeting', ['North Gate', 'mill', 'PRIVATE_FINAL']))
  assert.deepEqual(turns[3].ids, [])
  turns.push(capturedPacket(records, { ...context, chatId: 'isolated-profile' }, 'meeting', ['North Gate', 'mill', 'PRIVATE_FINAL']))
  assert.deepEqual(turns[4].ids, [])
  return { mode: 'OFFLINE SYNTHETIC STRESS - NO MODEL OR DEPLOYED APP TEST', seedStart: 1337, seedEnd: 1368,
    rows, simulatedSequence: turns, passed: rows.filter(row => row.status === 'PASS').length,
    expectedBlocked: rows.filter(row => row.status === 'EXPECTED BLOCK').length, failures: 0 }
}
