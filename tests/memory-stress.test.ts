// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runStressEvaluation, stressCases } from '../scripts/memory-evaluation/stress.mjs'

afterEach(() => vi.unstubAllGlobals())
describe('synthetic stress captures (not app persistence)', () => {
  it('passes eleven distinct edges and rejects three invalid inputs before capture', () => {
    const network = vi.fn(() => { throw new Error('Forbidden') })
    vi.stubGlobal('fetch', network)
    const report = runStressEvaluation()
    expect(stressCases).toHaveLength(14)
    expect(report).toMatchObject({ passed: 11, expectedBlocked: 3, failures: 0 })
    expect(report.rows.filter(row => row.perturbations === 32)).toHaveLength(11)
    expect(network).not.toHaveBeenCalled()
  })
  it('compares normalized captured packets across two actual stress invocations', () => {
    const first = runStressEvaluation()
    const second = runStressEvaluation()
    expect(second.rows.map(row => [row.id, row.packet, row.status])).toEqual(first.rows.map(row => [row.id, row.packet, row.status]))
    expect(second.simulatedSequence).toEqual(first.simulatedSequence)
  })
  it('captures corrected/reloaded/repeated, revoked and explicitly isolated sequence turns', () => {
    const turns = runStressEvaluation().simulatedSequence
    expect(turns.map(turn => turn.ids)).toEqual([['plan-1'], ['plan-2'], ['plan-2'], [], []])
    expect(turns[1].packet).toBe(turns[2].packet)
    expect(turns[3].packet).not.toContain('North Gate')
    expect(turns[3].packet).not.toContain('mill')
  })
})
