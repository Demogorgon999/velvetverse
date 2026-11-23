import { serializeFixtureMemoryLabels, validateLabelLedger } from './memoryLabels'
import { selectCandidate } from '../../scripts/memory-evaluation/selector.mjs'
import type { DialogueRequest, DialogueTransport } from '../services/dialogueTransport'

export type MockLabelScope = { characterId: number; storyScopeId: string }
export type MockScene = 'greet' | 'meeting' | 'continue' | 'delay'
export const mockLedgerKey = 'velvetverse-experiment-labels-v1:mock-integration'
export function mockLabelsEnabled() {
  return import.meta.env.DEV && import.meta.env.MODE === 'mock-labels' && location.hostname === '127.0.0.1' &&
    location.port === '5175' && new URLSearchParams(location.search).get('experiment') === 'labels-v1'
}
export const sceneCommands: Record<MockScene, string> = {
  greet: 'Greet the traveler using only the current authorized alias, otherwise use traveler.',
  meeting: 'Continue the fictional meeting scene using only the allowed facts.',
  continue: 'Continue the fictional scene using only the allowed facts.',
  delay: 'Continue the fictional scene after a scripted local delay.',
}
const labelScope = (scope: MockLabelScope) => ({ experimental: true as const, fixtureOnly: true as const,
  ...scope, maxRecords: 16, maxMemoryBytes: 8192 })

export function authorizedMockAlias(ledger: unknown, scope: MockLabelScope): string | null {
  const valid = validateLabelLedger(ledger)
  const allowed = JSON.parse(serializeFixtureMemoryLabels(valid, labelScope(scope))) as { memories: { id: string; summary: string }[] }
  const current = valid.events.filter(event => event.characterId === scope.characterId && event.storyScopeId === scope.storyScopeId && event.factId === 'alias').at(-1)
  const alias = current && allowed.memories.find(record => record.id === current.id)?.summary
  return alias && /^[A-Za-z][A-Za-z -]{0,39}$/.test(alias) ? alias : null
}

export function mockScopedGreeting(ledger: unknown, scope: MockLabelScope) {
  try { return `Welcome, ${authorizedMockAlias(ledger, scope) ?? 'traveler'}. This is a fictional mock scene.` }
  catch { return 'Welcome, traveler. This is a fictional mock scene.' }
}

export function buildMockLabelRequest(ledger: unknown, scope: MockLabelScope, scene: MockScene): DialogueRequest {
  if (!Object.hasOwn(sceneCommands, scene)) throw new Error('Only explicit fixture scene commands are allowed.')
  const valid = validateLabelLedger(ledger)
  const disclosed = JSON.parse(serializeFixtureMemoryLabels(valid, labelScope(scope))) as { memories: { id: string; summary: string }[] }
  const records = disclosed.memories.map(record => {
    const event = valid.events.find(event => event.id === record.id && event.characterId === scope.characterId && event.storyScopeId === scope.storyScopeId)!
    return { id: event.id, type: 'shared_experience', summary: record.summary, characterId: event.characterId,
      chatId: event.storyScopeId, visibility: 'shared', perceivedBy: event.observedBy, source: event.provenance,
      factKey: event.factId, revision: event.sequence, createdAt: new Date(event.sequence * 1000).toISOString(),
      importance: 0, emotionalWeight: 0, tags: [event.factId] }
  })
  const query = scene === 'greet' ? 'alias' : scene === 'meeting' ? 'meeting' : 'alias meeting bridge tower river'
  const selected = selectCandidate(records, { characterId: scope.characterId, chatId: scope.storyScopeId,
    maxMemories: 3, maxMemoryBytes: 600 }, query).selected
  const packet = { version: 1, mode: 'mock-only-label-integration', characterId: scope.characterId,
    storyScopeId: scope.storyScopeId, alias: authorizedMockAlias(valid, scope),
    memories: selected.map(record => ({ id: record.id, summary: record.summary })), scene, command: sceneCommands[scene] }
  // Entire experimental request is constructed here. No raw input/history,
  // regular memory fields, character secrets, or previous replies are accepted.
  const messages: DialogueRequest['messages'] = [
    { role: 'system', content: 'Fictional local mock only. Use the supplied scoped packet. No other context or external provider is available.' },
    { role: 'user', content: JSON.stringify(packet) },
  ]
  if (new TextEncoder().encode(JSON.stringify(messages)).byteLength > 4000) throw new Error('Experimental request budget exceeded.')
  return { messages, temperature: 0.7, topP: 0.9, repeatPenalty: 1.22 }
}

export const localLabelMockTransport: DialogueTransport = async request => {
  const packet = JSON.parse(request.messages[1].content) as { scene: MockScene; alias: string | null; memories: { summary: string }[] }
  if (packet.scene === 'delay') await new Promise(resolve => setTimeout(resolve, 10_000))
  // Deliberately ignores abort during the delay so the caller's cancellation is tested.
  return `[MOCK SCRIPT] Welcome, ${packet.alias ?? 'traveler'}. Allowed facts: ${packet.memories.map(memory => memory.summary).join('; ') || 'none'}.`
}
