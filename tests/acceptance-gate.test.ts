// @vitest-environment node
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PersistentMockGate, validateMockPolicy } from '../scripts/acceptance/gate.mjs'
const policy = { provider: 'injected-fake-only', ratesKind: 'synthetic-test-only', capMicros: 1000000, creditCeilingMicros: 1000000,
  headroomMicros: 100000, fakeInputUnitMicros: 1, fakeOutputUnitMicros: 2, maxInputBytes: 8192, maxOutputBytes: 1024,
  timeoutMs: 500, expiresAt: '2030-01-01T00:00:00.000Z', testerIds: ['fictional-a', 'fictional-b'] }
const one = { testerId: 'fictional-a', storyId: 'story-one', characterId: 1 }
const two = { testerId: 'fictional-b', storyId: 'story-one', characterId: 1 }
const input = { spoken: 'A fictional bridge scene.', visibleAction: '', privateThought: '', shareObserved: true }
const gates: InstanceType<typeof PersistentMockGate>[] = []
const file = () => join(mkdtempSync(join(tmpdir(), 'vv-acceptance-test-')), 'ledger.json')
const open = (path = file(), overrides = {}) => { const gate = new PersistentMockGate(path, { ...policy, ...overrides }); gates.push(gate); return gate }
const complete = ({ save }: { save: Record<string, unknown> }) => ({ reply: 'M', capture: '{}', usage: { inputUnits: 1, outputUnits: 1 }, save: { ...save, conversation: 2 } })
afterEach(async () => { for (const gate of gates.splice(0)) if (!gate.closed) await gate.close() })

describe('persistent fake-only pre-dispatch acceptance gate', () => {
  it('fails closed for missing budgets, over-25 caps, lower credit ceiling, missing headroom and any non-fake provider', () => {
    for (const invalid of [{}, { ...policy, capMicros: 25000001 }, { ...policy, creditCeilingMicros: 5 },
      { ...policy, headroomMicros: 0 }, { ...policy, provider: 'live' }, { ...policy, ratesKind: 'real-price' }]) expect(() => validateMockPolicy(invalid)).toThrow()
  })
  it('persists a reservation before dispatch, reconciles known synthetic usage and replays an id once across restart', async () => {
    const path = file(); const gate = open(path)
    const work = vi.fn(async (request: { save: Record<string, unknown> }) => {
      const disk = JSON.parse(readFileSync(path, 'utf8'))
      expect(Object.values(disk.entries)[0]).toMatchObject({ status: 'reserved', reservedMicros: 10240 })
      return complete(request)
    })
    const first = await gate.execute(one, 'turn-one', input, work)
    expect(first.usage).toEqual({ inputUnits: 1, outputUnits: 1 })
    expect(gate.summary()).toMatchObject({ spentMicros: 3, heldMicros: 0 })
    await gate.close(); const restarted = open(path)
    const replay = await restarted.execute(one, 'turn-one', input, work)
    expect(replay.replay).toBe(true); expect(work).toHaveBeenCalledOnce()
    expect(restarted.getSave(one).conversation).toBe(2)
    expect(restarted.getSave(two).conversation).toBe(1)
  })
  it('admits exactly one of two concurrent requests when one reservation slot remains', async () => {
    const gate = open(file(), { capMicros: 10340, creditCeilingMicros: 10340, headroomMicros: 100 })
    let finish!: (value: unknown) => void
    const first = gate.execute(one, 'first', input, async (request: { save: Record<string, unknown> }) => await new Promise(resolve => { finish = () => resolve(complete(request)) }))
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    const secondWork = vi.fn()
    await expect(gate.execute(two, 'second', input, secondWork)).rejects.toMatchObject({ code: 'mock_budget_exhausted' })
    expect(secondWork).not.toHaveBeenCalled(); finish(null); await first
  })
  it('holds ambiguous timeout reservations after restart and never retries an uncertain or duplicate turn', async () => {
    const path = file(); const gate = open(path, { timeoutMs: 20 })
    const work = vi.fn(() => new Promise(() => {}))
    await expect(gate.execute(one, 'uncertain', input, work)).rejects.toMatchObject({ code: 'ambiguous_timeout_held' })
    expect(gate.summary()).toMatchObject({ heldMicros: 10240, spentMicros: 0 })
    await gate.close(); const restarted = open(path, { timeoutMs: 20 })
    expect(restarted.summary().heldMicros).toBe(10240)
    await expect(restarted.execute(one, 'uncertain', input, work)).rejects.toMatchObject({ code: 'request_pending_or_held' })
    await expect(restarted.execute(one, 'new-id', input, work)).rejects.toMatchObject({ code: 'scope_busy_or_held' })
    expect(work).toHaveBeenCalledOnce()
  })
  it('rejects simultaneous duplicates and conflicting payload reuse before another dispatch', async () => {
    const gate = open(); let finish!: (value: unknown) => void
    const first = gate.execute(one, 'duplicate', input, async (request: { save: Record<string, unknown> }) => await new Promise(resolve => { finish = () => resolve(complete(request)) }))
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    await expect(gate.execute(one, 'duplicate', input, vi.fn())).rejects.toMatchObject({ code: 'request_pending_or_held' })
    await expect(gate.execute(one, 'duplicate', { ...input, spoken: 'Different' }, vi.fn())).rejects.toMatchObject({ code: 'idempotency_conflict' })
    finish(null); await first
  })
  it('reconciles known failure usage but leaves progress unchanged, and releases only certain pre-dispatch failures', async () => {
    const gate = open()
    await expect(gate.execute(one, 'known', input, async () => { throw Object.assign(new Error('Known fake failure'), { knownUsage: { inputUnits: 2, outputUnits: 1 } }) })).rejects.toThrow()
    expect(gate.summary()).toMatchObject({ spentMicros: 4, heldMicros: 0 })
    expect(gate.getSave(one).transcript).toHaveLength(0)
    await expect(gate.execute(one, 'before', input, async () => { throw Object.assign(new Error('Before fake'), { knownNoDispatch: true }) })).rejects.toThrow()
    expect(gate.summary()).toMatchObject({ spentMicros: 4, heldMicros: 0 })
  })
  it('persists close/expiry and blocks malformed sizes or usage instead of silently resetting the cap', async () => {
    const gate = open(); await gate.closeTest()
    await expect(gate.execute(one, 'closed', input, vi.fn())).rejects.toMatchObject({ code: 'test_closed' })
    const expired = open(file(), { expiresAt: '2020-01-01T00:00:00.000Z' })
    await expect(expired.execute(one, 'expired', input, vi.fn())).rejects.toMatchObject({ code: 'test_expired' })
    const normal = open()
    await expect(normal.execute(one, 'large', { text: 'x'.repeat(9000) }, vi.fn())).rejects.toMatchObject({ code: 'invalid_or_oversized_turn' })
    await expect(normal.execute(one, 'bad-usage', input, async () => ({ ...complete({ save: {} }), usage: { inputUnits: 999999, outputUnits: 0 } }))).rejects.toThrow()
    expect(normal.summary().heldMicros).toBe(10240)
  })
  it('uses one owner lock and refuses corrupt or changed-policy ledgers rather than starting fresh', async () => {
    const path = file(); const first = open(path)
    expect(() => new PersistentMockGate(path, policy)).toThrow('ledger_locked')
    await first.close()
    expect(() => new PersistentMockGate(path, { ...policy, capMicros: 900000 })).toThrow('invalid_ledger')
    writeFileSync(path, '{corrupt')
    expect(() => new PersistentMockGate(path, policy)).toThrow('invalid_ledger')
  })
})
