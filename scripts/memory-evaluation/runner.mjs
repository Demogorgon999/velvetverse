import assert from 'node:assert/strict'
import { getRelevantExperienceMemories } from '../../src/utils/memory.ts'
import { cases, context, forbidden } from './fixtures.mjs'
import { eligible, selectCandidate, serializePacket, memoryBytes } from './selector.mjs'

export function selectActualBaseline(records, characterId = 1) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  // Only synthetic storage inside this terminal/test process; no browser/disk writes.
  const experiences = records.filter(record => record.characterId === characterId).map(record => ({
    id: record.id, type: record.type, summary: record.summary, importance: record.importance,
    emotionalWeight: record.emotionalWeight, createdAt: record.createdAt,
  }))
  const storage = { getItem: key => key === `velvetverse-memory-${characterId}`
    ? JSON.stringify({ experiences, likes: [], dislikes: [], importantFacts: [], relationshipScore: 0, updatedAt: '2026-11-17T00:00:00.000Z' }) : null,
  setItem: () => { throw new Error('Baseline must remain read-only.') }, removeItem: () => { throw new Error('Baseline must remain read-only.') } }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  try { return getRelevantExperienceMemories(characterId, 6) }
  finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
    else delete globalThis.localStorage
  }
}

export function captureMockProvider(label, captures) {
  return packet => {
    const beforeFormatting = JSON.stringify(JSON.parse(packet))
    const formatted = label === 'C' ? { input: [{ role: 'user', content: beforeFormatting }] }
      : { messages: [{ role: 'user', content: beforeFormatting }] }
    const serialized = JSON.stringify(formatted)
    captures.push({ lane: label, beforeFormatting, serialized })
    return { mock: true, reply: `[MOCK ${label}] No generated dialogue: ${JSON.parse(packet).memories.length} supplied memory records.`,
      latencyMs: null, tokens: null, cost: null, blindedReply: '', reviewerWouldContinue: null }
  }
}

export function checkPacket(packet, testCase, currentContext = context) {
  const parsed = JSON.parse(packet)
  const ids = parsed.memories.map(record => record.id)
  const records = ids.map(id => testCase.records.find(record => record.id === id))
  const scopeSafe = records.every(record => record && eligible(record, currentContext)) && forbidden.every(marker => !packet.includes(marker))
  const required = testCase.expectedIds.every(id => ids.includes(id))
  const forbiddenClaim = testCase.id === 'unverified-rescue' && ids.includes('rescue-claim')
  const stale = ids.includes('meeting-old')
  const noDuplicates = new Set(records.map(record => record?.factKey)).size === records.length
  const budget = Buffer.byteLength(JSON.stringify(parsed.memories), 'utf8') <= currentContext.maxMemoryBytes && ids.length <= currentContext.maxMemories
  return { scopeSafe, required, factIntegrity: !forbiddenClaim && !stale, noDuplicates, budget,
    pass: scopeSafe && required && !forbiddenClaim && !stale && noDuplicates && budget }
}

export function runMemoryEvaluation() {
  const captures = []
  const mockSameProvider = captureMockProvider('A/B', captures)
  const mockFutureProvider = captureMockProvider('C', captures)
  const rows = cases.map(testCase => {
    const baseline = selectActualBaseline(testCase.records)
    const candidate = selectCandidate(testCase.records, context, testCase.query)
    const packetA = serializePacket(context, testCase.query, baseline)
    const packetB = serializePacket(context, testCase.query, candidate.selected)
    const packetC = packetB
    const outputA = mockSameProvider(packetA)
    const captureA = captures.at(-1)
    const outputB = mockSameProvider(packetB)
    const captureB = captures.at(-1)
    const outputC = mockFutureProvider(packetC)
    const captureC = captures.at(-1)
    assert.equal(captureB.beforeFormatting, captureC.beforeFormatting, 'B/C allowed packets differ')
    // Assert on the captured, final provider-formatted serialized payload, not just selection ids.
    for (const capture of [captureB, captureC]) {
      const formatted = JSON.parse(capture.serialized)
      const finalPacket = formatted.messages?.[0].content ?? formatted.input?.[0].content
      assert.equal(finalPacket, packetB)
      for (const marker of forbidden) assert.equal(capture.serialized.includes(marker), false, `Forbidden marker ${marker} in ${testCase.id}`)
      assert.equal(checkPacket(finalPacket, testCase).pass, true, `Candidate failed ${testCase.id}`)
    }
    return { id: testCase.id, note: testCase.note, expectedIds: testCase.expectedIds,
      A: { ids: baseline.map(record => record.id), bytes: memoryBytes(baseline), checks: checkPacket(captureA.beforeFormatting, testCase), output: outputA },
      B: { ids: candidate.selected.map(record => record.id), bytes: memoryBytes(candidate.selected), checks: checkPacket(captureB.beforeFormatting, testCase), output: outputB },
      C: { ids: candidate.selected.map(record => record.id), bytes: memoryBytes(candidate.selected), checks: checkPacket(captureC.beforeFormatting, testCase), output: outputC },
      identicalBC: captureB.beforeFormatting === captureC.beforeFormatting,
      candidateDecisions: candidate.decisions,
      packets: { A: captureA, B: captureB, C: captureC } }
  })
  return { mode: 'OFFLINE SYNTHETIC SELECTOR EVALUATION - NOT A MODEL QUALITY COMPARISON',
    baseline: 'Actual getRelevantExperienceMemories(characterId, 6), unchanged, seeded with adversarial synthetic character storage.',
    candidate: 'Harness-only explicit metadata eligibility, latest fact, dedupe, lexical relevance, deterministic order, 600-byte/3-record memory budget.',
    providerComparison: 'A/B use the same capture stub; C uses only a future-provider format stub. No OpenAI adapter loaded.',
    context, rows }
}
