import { parentPort, workerData } from 'node:worker_threads'
import { registerHooks } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const sourceRoot = new URL('../../src/', import.meta.url)
const sharedRoot = new URL('../../shared/', import.meta.url)
const isolatedOverrides=new Map(['services/characterDialogueService.ts','services/roleplayInterpreterService.ts','services/interactionAssessmentService.ts','utils/relationshipEngine.ts','utils/replies/index.ts','utils/replies/types.ts'].map(path=>[new URL(path,sourceRoot).href,new URL('../guest-runtime/'+path,import.meta.url)]))
// Worker-only snapshots of the tested adapter seam. The production imports/files
// remain unchanged; original module URLs preserve their relative dependencies.
registerHooks({load(url,context,nextLoad){const replacement=isolatedOverrides.get(url);return replacement?{format:'module-typescript',source:readFileSync(replacement,'utf8'),shortCircuit:true}:nextLoad(url,context)}, resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.(?:ts|tsx|js|mjs|json)$/.test(specifier)) {
    const target = new URL(specifier, context.parentURL)
    if (!target.href.startsWith(sourceRoot.href) && !target.href.startsWith(sharedRoot.href)) throw new Error('Worker source resolution escaped allowed code roots')
    for (const suffix of ['.ts', '/index.ts']) if (existsSync(fileURLToPath(target.href + suffix))) return nextResolve(specifier + suffix, context)
  }
  return nextResolve(specifier, context)
} })
for (const method of ['log', 'warn', 'error', 'debug', 'info']) console[method] = () => {}
const { scope, input, save, guestMemoryCore } = workerData
const data = new Map(Object.entries(save.state ?? {}))
globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)),
  removeItem: key => data.delete(key), clear: () => data.clear(), key: index => [...data.keys()][index] ?? null, get length() { return data.size } }
globalThis.fetch = async (url, init) => {
  init?.signal?.throwIfAborted()
  if (String(url) !== 'http://localhost:11434/api/chat') throw new Error('Offline worker blocks every external request')
  const body = JSON.parse(String(init.body))
  if (body.model !== 'llama3:8b' || body.format !== 'json') throw new Error('Only fake interpretation/assessment may use this shim')
  const interpreter = String(body.messages[0].content).includes('"spokenDialogue"')
  const content = interpreter ? { spokenDialogue: input.spoken ? [input.spoken] : [], userActions: input.visibleAction ? [input.visibleAction] : [],
    userThoughts: input.privateThought ? [input.privateThought] : [], observations: [], narration: [],
    movement: { changesLocation: false, targetLocation: null, leavesCharacter: false, approachesCharacter: false }, claims: [] }
    : { respectful: 0.25, supportive: 0, loyal: 0, romantic: 0, hostile: 0 }
  return Response.json({ message: { content: JSON.stringify(content) } })
}
try {
  const { getCharacterEngineContext } = await import('../../src/utils/characterEngine.ts')
  const { getCharacterReply } = await import('../../src/utils/replies/index.ts')
  const { getCharacterById } = await import('../../src/services/characterRepository.ts')
  const { updateMoodFromMessage } = await import('../../src/utils/mood.ts')
  const { beginCharacterTurn } = await import('../../src/utils/characterTurn.ts')
  const { applyReplyEffects } = await import('../../src/utils/replyEffects.ts')
  const { configureDialogueTransport } = await import('../../src/services/dialogueTransport.ts')
  let approved
  if(guestMemoryCore){
    if(guestMemoryCore.characterId!==scope.characterId||guestMemoryCore.storyScopeId!==scope.storyId)throw new Error('Guest snapshot scope mismatch')
    approved=guestMemoryCore
  }else{
  const { serializeFixtureMemoryLabels, validateLabelLedger } = await import('../../src/experimental/memoryLabels.ts')
  const { authorizedMockAlias } = await import('../../src/experimental/mockLabelIntegration.ts')
  const { selectCandidate } = await import('./../memory-evaluation/selector.mjs')
  const labelScope = { characterId: scope.characterId, storyScopeId: scope.storyId }
  const labels = validateLabelLedger(save.labels)
  const allowed = JSON.parse(serializeFixtureMemoryLabels(labels, { ...labelScope, experimental: true, fixtureOnly: true, maxRecords: 16, maxMemoryBytes: 8192 })).memories
  const candidates = allowed.map(record => {
    const event = labels.events.find(event => event.id === record.id && event.characterId === scope.characterId && event.storyScopeId === scope.storyId)
    return { id: event.id, summary: record.summary, type: 'shared_experience', characterId: event.characterId, chatId: event.storyScopeId,
      visibility: 'shared', perceivedBy: event.observedBy, source: event.provenance, factKey: event.factId, revision: event.sequence,
      createdAt: new Date(event.sequence * 1000).toISOString(), importance: 0, emotionalWeight: 0, tags: [event.factId] }
  })
  const selected = selectCandidate(candidates, { characterId: scope.characterId, chatId: scope.storyId, maxMemories: 3, maxMemoryBytes: 600 }, `${input.spoken} ${input.visibleAction}`).selected
  approved = { mode: 'acceptance-fake-only', characterId: scope.characterId, storyScopeId: scope.storyId,
    alias: authorizedMockAlias(labels, labelScope), observedSpoken: input.spoken, observedAction: input.visibleAction,
    memories: selected.map(record => ({ id: record.id, summary: record.summary })) }
  }
  let dispatches = 0
  configureDialogueTransport(async request => {
    if (++dispatches > 1) throw new Error('No hidden final-generation retry allowed in acceptance mode')
    // Full legacy prompt is built by the actual engine but is never forwarded.
    parentPort.postMessage({ kind: 'dispatch', packet: approved, rawPromptBuilt: request.messages.length > 0 })
    return await new Promise((resolve, reject) => {
      parentPort.once('message', message => message.kind === 'fake-result' ? resolve(message.text) : reject(new Error('Fake final generator failed')))
    })
  })
  const turn = beginCharacterTurn(scope.characterId, localStorage)
  const character = getCharacterById(scope.characterId)
  const raw = [input.spoken, input.visibleAction && `[Visible action] ${input.visibleAction}`, input.privateThought && `[Private thought] ${input.privateThought}`].filter(Boolean).join('\n')
  updateMoodFromMessage(scope.characterId, raw)
  const context = getCharacterEngineContext(scope.characterId)
  const history = save.transcript.slice(-10).flatMap(turn => [{ sender: 'user', text: turn.spoken }, { sender: 'character', text: turn.reply }])
  const reply = await getCharacterReply(context, character.name, raw, history, turn.signal)
  turn.signal.throwIfAborted(); applyReplyEffects(scope.characterId, reply); turn.commit()
  let visibleReply=reply.text
  if(guestMemoryCore&&dispatches===0){const {detectIntent}=await import('../../src/utils/intent/index.ts');const {scopedGuestLocalReply}=await import('../tester/guestLocalReply.mjs');visibleReply=scopedGuestLocalReply(detectIntent(input.spoken+' '+input.visibleAction),approved.alias)}
  parentPort.postMessage({ kind: 'done', reply: visibleReply, state: Object.fromEntries(data),
    engineReceipt: { actualRoleplayOrchestration: true, semanticInterpreter: 'declared-field fake', semanticAssessment: 'neutral fake',
      finalDispatches: dispatches, specialHandler: dispatches === 0, rawLegacyPromptForwarded: false, characterName: character.name,...(guestMemoryCore?{guestMemoryViewVersion:1,scopedLocalReply:dispatches===0}:{}) } })
} catch { parentPort.postMessage({ kind: 'failed' }) }
