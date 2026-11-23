const base = { characterId: 1, chatId: 'chat-main', visibility: 'shared', perceivedBy: [1],
  source: 'observed', type: 'shared_experience', importance: 10, emotionalWeight: 5,
  revision: 1, createdAt: '2026-11-01T12:00:00.000Z' }
export const memory = (id, summary, extra = {}) => ({ ...base, id, factKey: id, summary, tags: [], ...extra })
const distractions = (count = 6) => Array.from({ length: count }, (_, i) => memory(`distractor-${i}`,
  i % 2 ? `They discussed tea blend number ${i}.` : `They polished lantern number ${i}.`,
  { importance: 90 - i, emotionalWeight: 50, createdAt: `2026-11-${String(10 + i).padStart(2, '0')}T12:00:00.000Z` }))
export const context = Object.freeze({ characterId: 1, chatId: 'chat-main', maxMemories: 3, maxMemoryBytes: 600 })
const guards = () => [
  memory('other-chat-guard', 'Copper was the nickname in a separately isolated story profile.', { chatId: 'profile-isolated', importance: 100, emotionalWeight: 100 }),
  memory('private-guard', 'AMBER LARK is the player private thought.', { visibility: 'private', perceivedBy: [], importance: 100, emotionalWeight: 100 }),
  memory('offscreen-guard', 'OFFSCREEN QUARTZ: a messenger crossed a remote desert unseen.', { visibility: 'offscreen', perceivedBy: [], importance: 100, emotionalWeight: 100 }),
  memory('secret-guard', 'GUILD SECRET: Seraphina left to protect her brother from the guild.', { visibility: 'character-only', importance: 100, emotionalWeight: 100 }),
  memory('other-character-guard', 'OTHER CHARACTER OPAL: Nova hides a blue badge.', { characterId: 2, importance: 100, emotionalWeight: 100 }),
]
export const forbidden = ['Copper', 'AMBER LARK', 'OFFSCREEN QUARTZ', 'GUILD SECRET', 'OTHER CHARACTER OPAL', 'protect her brother']
const make = (id, query, records, expectedIds, note) => ({ id, query, records: [...records, ...guards()], expectedIds, note })
export const cases = [
  make('bridge-rockslide', 'Can the bridge route still take us to the tower?', [
    memory('bridge-closed', 'A rockslide closed the bridge to the tower; the east causeway remains open.', { tags: ['bridge', 'route', 'tower'] }),
    ...distractions(),
  ], ['bridge-closed'], 'Critical older bridge fact amid recent high-weight lantern and tea distractors.'),
  make('corrected-meeting', 'Where is the meeting now?', [
    memory('meeting-old', 'The meeting is at North Gate.', { factKey: 'meeting-place', revision: 1, importance: 98, emotionalWeight: 99, tags: ['meeting'] }),
    memory('meeting-new', 'The meeting moved to the mill; this replaces the North Gate arrangement.', { factKey: 'meeting-place', revision: 2, tags: ['meeting'] }),
    ...distractions(),
  ], ['meeting-new'], 'Latest explicit revision wins before ranking; never send the obsolete standalone fact.'),
  make('unverified-rescue', 'The player claims: we rescued Captain Venn. Is there a remembered rescue?', [
    memory('rescue-claim', 'We rescued Captain Venn together.', { source: 'user-claim', importance: 100, emotionalWeight: 100, tags: ['rescued', 'venn'] }),
    ...distractions(),
  ], [], 'A claim is input for interpretation, not a verified remembered event; no rescue is promoted to fact.'),
  make('private-thought', 'Seraphina sees the player quietly examine the map. Continue only the visible scene.', distractions(), [],
    'Raw private AMBER LARK thought is kept outside the perceived query and all allowed memory packets.'),
  make('cross-chat-nickname', 'How does Seraphina address the traveler in this chat?', distractions(), [],
    'Same character, explicitly isolated profile: Copper must not cross that fixture boundary; ordinary New Conversation continuity is not declared a bug.'),
  make('undisclosed-guild-reasons', 'Why did Seraphina leave the guild?', [
    memory('guild-public', 'Seraphina said she left the guild, but has not shared her reasons.', { tags: ['guild', 'leave'] }),
    ...distractions(),
  ], ['guild-public'], 'Only the disclosed boundary is sent; undisclosed reasons are not a dialogue memory.'),
  make('paper-boat-callback', 'The river rises around the bank. What shared moment could naturally matter?', [
    memory('paper-boat', 'They folded a paper boat together on the river bank and watched it float.', { tags: ['river', 'bank', 'boat'] }),
    ...distractions(),
  ], ['paper-boat'], 'A relevant shared callback is selected without forcing its wording into a generated answer.'),
  make('paraphrases-distractors', 'Which brass key opens the tower door?', [
    memory('key-original', 'Vale gave them a brass key for the tower door.', { factKey: 'tower-key', tags: ['key', 'tower', 'door'] }),
    memory('key-paraphrase-a', 'The tower door can be opened with the brass key from Vale.', { factKey: 'tower-key', tags: ['key', 'tower', 'door'] }),
    memory('key-paraphrase-b', 'Their brass tower key was a gift from Vale.', { factKey: 'tower-key', tags: ['key', 'tower', 'door'] }),
    ...distractions(12),
  ], ['key-original'], 'One explicit canonical fact key deduplicates two paraphrases before the twelve distractors are ranked.'),
]
