const stop = /* @__PURE__ */ new Set('a an the to of is are was were we us they them their for at in on with what which how why can could still now there this that from has have and only continue scene player seraphina'.split(' '))
const terms = value => new Set(value.toLowerCase().match(/[a-z0-9]+/g)?.filter(term => !stop.has(term)) ?? [])
const compareId = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
const normalized = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
export const projectMemory = record => ({ id: record.id, type: record.type, summary: record.summary })
export const memoryBytes = records => new TextEncoder().encode(JSON.stringify(records.map(projectMemory))).byteLength

const inScope = (record, context) => record.characterId === context.characterId &&
  (record.chatId === context.chatId || (Array.isArray(context.allowedChatIds) && context.allowedChatIds.includes(record.chatId)))
// Trusted control metadata can suppress an older fact even when its new content
// cannot be disclosed. Other scopes and unverified claims never control this timeline.
const authoritative = (record, context) => inScope(record, context) && record.source === 'observed' &&
  typeof record.factKey === 'string' && record.factKey.length > 0 && Number.isSafeInteger(record.revision) && record.revision >= 1 &&
  typeof record.id === 'string' && record.id.length > 0 && Number.isFinite(Date.parse(record.createdAt))

// Opt-in synthetic candidate; default app retrieval never calls it.
// Missing scope, visibility or provenance fails closed.
export function eligible(record, context) {
  return inScope(record, context) && record.revoked !== true &&
    record.visibility === 'shared' && Array.isArray(record.perceivedBy) && record.perceivedBy.includes(context.characterId) &&
    record.source === 'observed' && typeof record.factKey === 'string' && record.factKey.length > 0 &&
    Number.isSafeInteger(record.revision) && record.revision >= 1 &&
    typeof record.id === 'string' && record.id.length > 0 && typeof record.summary === 'string' && record.summary.trim().length > 0 &&
    typeof record.createdAt === 'string' && Number.isFinite(Date.parse(record.createdAt)) &&
    Number.isFinite(record.importance) && Number.isFinite(record.emotionalWeight) &&
    Array.isArray(record.tags) && record.tags.every(tag => typeof tag === 'string')
}

export function selectCandidate(records, context, query) {
  if (!Array.isArray(records) || records.length > 256 || typeof query !== 'string' || new TextEncoder().encode(query).byteLength > 4096) {
    throw new Error('Harness input limit exceeded (256 records / 4096 query bytes).')
  }
  if (!Number.isSafeInteger(context.maxMemories) || context.maxMemories < 0 ||
      !Number.isSafeInteger(context.maxMemoryBytes) || context.maxMemoryBytes < 2) throw new Error('Invalid candidate budget.')
  const decisions = []
  const latest = new Map()
  const eligibleIds = new Set()
  for (const record of records) {
    if (!authoritative(record, context)) { decisions.push({ id: record.id, reason: 'ineligible-control-metadata' }); continue }
    if (eligibleIds.has(record.id)) throw new Error('Duplicate eligible record id; metadata must be unambiguous.')
    eligibleIds.add(record.id)
    const prior = latest.get(record.factKey)
    const newer = !prior || record.revision > prior.revision || (record.revision === prior.revision &&
      (Date.parse(record.createdAt) > Date.parse(prior.createdAt) ||
        (Date.parse(record.createdAt) === Date.parse(prior.createdAt) && compareId(record, prior) < 0)))
    if (newer) {
      if (prior) decisions.push({ id: prior.id, reason: 'superseded-or-canonical-duplicate' })
      latest.set(record.factKey, record)
    } else decisions.push({ id: record.id, reason: 'superseded-or-canonical-duplicate' })
  }
  const queryTerms = terms(query)
  const seenSummaries = new Set()
  const disclosed = [...latest.values()].filter(record => {
    if (!eligible(record, context)) { decisions.push({ id: record.id, reason: 'latest-not-disclosable' }); return false }
    // Synthetic derived summaries must name every underlying fact revision.
    if (record.derivedFrom !== undefined && (!Array.isArray(record.derivedFrom) || record.derivedFrom.length === 0 ||
      record.derivedFrom.some(dependency => {
        const source = latest.get(dependency.factKey)
        return !source || source.revision !== dependency.revision || !eligible(source, context)
      }))) { decisions.push({ id: record.id, reason: 'stale-or-inaccessible-derived-source' }); return false }
    return true
  })
  const ranked = disclosed.map(record => {
    const recordTerms = terms(record.summary + ' ' + record.tags.join(' '))
    const relevance = [...queryTerms].filter(term => recordTerms.has(term)).length
    return { record, relevance }
  }).sort((a, b) => b.relevance - a.relevance ||
    (b.record.importance + b.record.emotionalWeight) - (a.record.importance + a.record.emotionalWeight) || compareId(a.record, b.record))
  const selected = []
  for (const { record, relevance } of ranked) {
    const summary = normalized(record.summary)
    if (relevance === 0) { decisions.push({ id: record.id, reason: 'no-lexical-relevance' }); continue }
    if (seenSummaries.has(summary)) { decisions.push({ id: record.id, reason: 'exact-summary-duplicate' }); continue }
    seenSummaries.add(summary)
    if (selected.length >= context.maxMemories || memoryBytes([...selected, record]) > context.maxMemoryBytes) {
      decisions.push({ id: record.id, reason: 'budget' }); continue
    }
    selected.push(record)
    decisions.push({ id: record.id, reason: 'selected', relevance })
  }
  return { selected, decisions }
}

export function serializePacket(context, query, records) {
  // Deliberately excludes raw transcripts, hidden facts, tags and selector diagnostics.
  return JSON.stringify({ schema: 'velvetverse-memory-eval-v1', character: 'Seraphina',
    characterId: context.characterId, chatId: context.chatId, perceivedInput: query,
    memories: records.map(projectMemory),
    rule: 'Use these supplied shared facts only when relevant. Unverified user claims are not memories. Never invent an earlier event or disclose inaccessible information.' })
}
