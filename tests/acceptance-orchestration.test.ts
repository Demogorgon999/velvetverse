// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { runIsolatedRoleplay, validateFictionalInput } from '../scripts/acceptance/orchestration.mjs'
const policy = { maxInputBytes: 8192, maxOutputBytes: 1024 }
const scope = { testerId: 'fictional-a', storyId: 'story-one', characterId: 1 }
const save = { state: {}, transcript: [], labels: { version: 1, events: [] }, conversation: 1 }
const input = { spoken: 'I promise to bring a lantern before crossing the bridge.', visibleAction: 'Sets a map on the table.', privateThought: 'AMBER_LARK_PRIVATE marker is not spoken.', shareObserved: true }
describe('actual isolated normal roleplay worker with fake model steps', () => {
  it('runs arbitrary fictional turns through the actual orchestration, persists engine state and omits private/raw legacy context at final dispatch', async () => {
    const first = await runIsolatedRoleplay({ scope, input, save, signal: new AbortController().signal }, policy)
    expect(first.engineReceipt).toMatchObject({ actualRoleplayOrchestration: true, finalDispatches: 1, rawLegacyPromptForwarded: false })
    expect(first.capture).toContain(input.spoken)
    expect(first.capture).not.toContain('AMBER_LARK_PRIVATE')
    expect(first.save.transcript).toHaveLength(1)
    expect(first.save.state['velvetverse-memory-1']).toContain('lantern')
    const next = await runIsolatedRoleplay({ scope, input: { ...input, spoken: 'The tower door opens into a quiet gallery.', privateThought: '' }, save: JSON.parse(JSON.stringify(first.save)), signal: new AbortController().signal }, policy)
    expect(next.save.transcript).toHaveLength(2)
    expect(next.capture).not.toContain('AMBER_LARK_PRIVATE')
    expect(save.state).toEqual({})
  }, 20000)
  it('does not infer observed permission from arbitrary prose or allow oversized/private-only exports', () => {
    expect(() => validateFictionalInput({ ...input, shareObserved: false })).toThrow()
    expect(() => validateFictionalInput({ ...input, spoken: 'x'.repeat(2001) })).toThrow()
    expect(() => validateFictionalInput({ ...input, arbitraryHiddenChannel: 'secret' })).toThrow()
  })
})
