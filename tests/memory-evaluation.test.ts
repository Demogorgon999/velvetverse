// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cases, context, forbidden, memory } from '../scripts/memory-evaluation/fixtures.mjs'
import { eligible, selectCandidate, serializePacket, memoryBytes } from '../scripts/memory-evaluation/selector.mjs'
import { runMemoryEvaluation, selectActualBaseline } from '../scripts/memory-evaluation/runner.mjs'
import { getRelevantExperienceMemories } from '../src/utils/memory'

afterEach(() => vi.unstubAllGlobals())

describe('offline memory selector comparison', () => {
  it('runs all eight cases with no model traffic and captures identical allowed B/C packets', () => {
    const network = vi.fn(() => { throw new Error('Network forbidden') })
    vi.stubGlobal('fetch', network)
    const results = runMemoryEvaluation()
    expect(results.rows).toHaveLength(8)
    for (const row of results.rows) {
      expect(row.B.checks.pass).toBe(true)
      expect(row.C.checks.pass).toBe(true)
      expect(row.identicalBC).toBe(true)
      expect(row.packets.B.beforeFormatting).toBe(row.packets.C.beforeFormatting)
      const finalB = JSON.parse(row.packets.B.serialized).messages[0].content
      const finalC = JSON.parse(row.packets.C.serialized).input[0].content
      expect(finalB).toBe(finalC)
      for (const marker of forbidden) {
        expect(row.packets.B.serialized).not.toContain(marker)
        expect(row.packets.C.serialized).not.toContain(marker)
      }
      expect(row.B.output).toMatchObject({ mock: true, latencyMs: null, tokens: null, cost: null, reviewerWouldContinue: null })
    }
    expect(network).not.toHaveBeenCalled()
  })

  it('uses the actual unfiltered character-memory baseline, preserving its defects', () => {
    const records = cases[0].records
    const baseline = selectActualBaseline(records)
    expect(baseline).toHaveLength(6)
    expect(baseline.map(record => record.id)).toContain('other-chat-guard')
    expect(baseline.map(record => record.id)).not.toContain('bridge-closed')
    const storage = { getItem: () => JSON.stringify({ experiences: records.filter(record => record.characterId === 1) }) }
    vi.stubGlobal('localStorage', storage)
    expect(getRelevantExperienceMemories(1, 6).map(record => record.id)).toEqual(baseline.map(record => record.id))
    expect(runMemoryEvaluation().rows[0].A.checks.scopeSafe).toBe(false)
  })

  it('restores any pre-existing test storage without modifying it', () => {
    const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }
    vi.stubGlobal('localStorage', storage)
    const source = JSON.stringify(cases)
    selectActualBaseline(cases[0].records)
    expect(globalThis.localStorage).toBe(storage)
    expect(storage.getItem).not.toHaveBeenCalled()
    expect(storage.setItem).not.toHaveBeenCalled()
    expect(storage.removeItem).not.toHaveBeenCalled()
    expect(JSON.stringify(cases)).toBe(source)
  })

  it('fails closed when scope, perception, visibility, provenance or correction metadata is absent', () => {
    const allowed = memory('allowed', 'The tower bridge is closed.')
    expect(eligible(allowed, context)).toBe(true)
    for (const field of ['characterId', 'chatId', 'visibility', 'perceivedBy', 'source', 'factKey', 'revision', 'createdAt']) {
      const missing = { ...allowed, [field]: undefined }
      expect(eligible(missing, context)).toBe(false)
      expect(selectCandidate([missing], context, 'tower bridge').selected).toHaveLength(0)
    }
  })

  it('filters before ranking, so forbidden high-relevance records cannot influence selection', () => {
    const allowed = memory('allowed', 'The bridge is closed.')
    const hidden = memory('hidden', 'bridge bridge bridge closed', { visibility: 'private', importance: 100000, emotionalWeight: 100000 })
    expect(selectCandidate([allowed, hidden], context, 'bridge closed').selected.map(record => record.id)).toEqual(['allowed'])
  })

  it('resolves corrections before relevance even if the stale fact matches more query terms', () => {
    const old = memory('old', 'meeting North Gate lantern tea', { factKey: 'meeting', revision: 1, importance: 100 })
    const latest = memory('latest', 'The meeting moved to the mill.', { factKey: 'meeting', revision: 2 })
    const selected = selectCandidate([old, latest], context, 'meeting North Gate lantern tea').selected
    expect(selected.map(record => record.id)).toEqual(['latest'])
  })

  it('deduplicates explicit canonical paraphrases and exact normalized duplicate summaries', () => {
    const records = [memory('a', 'Brass key opens the tower.', { factKey: 'key' }),
      memory('b', 'The tower uses a brass key.', { factKey: 'key' }),
      memory('c', 'BRASS key opens the tower!', { factKey: 'different-id' })]
    expect(selectCandidate(records, context, 'brass key tower').selected.map(record => record.id)).toEqual(['a'])
  })

  it('uses chronological timestamps for latest facts and rejects ambiguous duplicate ids', () => {
    const older = memory('older', 'The meeting is at North Gate.', { factKey: 'meeting', createdAt: '2026-11-02T00:30:00+02:00' })
    const newer = memory('newer', 'The meeting is at the mill.', { factKey: 'meeting', createdAt: '2026-11-01T23:30:00Z' })
    expect(selectCandidate([older, newer], context, 'meeting').selected.map(record => record.id)).toEqual(['newer'])
    expect(() => selectCandidate([newer, { ...newer, summary: 'A conflicting meeting fact.' }], context, 'meeting')).toThrow('unambiguous')
  })

  it('is deterministic across input ordering and does not mutate records', () => {
    for (const testCase of cases) {
      const before = JSON.stringify(testCase.records)
      const normal = selectCandidate(testCase.records, context, testCase.query).selected
      const reversed = selectCandidate([...testCase.records].reverse(), context, testCase.query).selected
      expect(serializePacket(context, testCase.query, reversed)).toBe(serializePacket(context, testCase.query, normal))
      expect(JSON.stringify(testCase.records)).toBe(before)
    }
  })

  it('enforces count and serialized byte budgets without truncating or reviving stale facts', () => {
    const large = memory('large', 'bridge '.repeat(200), { importance: 100 })
    const small = memory('small', 'Bridge closed.')
    const bounded = { ...context, maxMemories: 1, maxMemoryBytes: 100 }
    const selected = selectCandidate([large, small], bounded, 'bridge').selected
    expect(selected.map(record => record.id)).toEqual(['small'])
    expect(memoryBytes(selected)).toBeLessThanOrEqual(100)
    expect(selectCandidate([small], { ...context, maxMemories: 0 }, 'bridge').selected).toHaveLength(0)
    expect(() => selectCandidate([small], { ...context, maxMemoryBytes: -1 }, 'bridge')).toThrow('budget')
  })

  it('keeps current claims distinct from verified stored memories', () => {
    const result = runMemoryEvaluation().rows.find(row => row.id === 'unverified-rescue')!
    const packet = JSON.parse(result.packets.B.beforeFormatting)
    expect(packet.perceivedInput).toContain('player claims')
    expect(packet.memories).toHaveLength(0)
    expect(result.B.checks.factIntegrity).toBe(true)
    expect(result.A.checks.factIntegrity).toBe(false)
  })
})
