export type CandidateRecord = {
  id: string; type: string; summary: string; characterId: number; chatId: string;
  visibility: string; perceivedBy: number[]; source: string; factKey: string; revision: number;
  createdAt: string; importance: number; emotionalWeight: number; tags: string[];
}
export type CandidateContext = { characterId: number; chatId: string; maxMemories: number; maxMemoryBytes: number; allowedChatIds?: string[] }
export function selectCandidate(records: CandidateRecord[], context: CandidateContext, query: string): {
  selected: CandidateRecord[]; decisions: { id: string; reason: string; relevance?: number }[]
}
export function eligible(record: CandidateRecord, context: CandidateContext): boolean
export function projectMemory(record: CandidateRecord): { id: string; type: string; summary: string }
export function memoryBytes(records: CandidateRecord[]): number
export function serializePacket(context: CandidateContext, query: string, records: CandidateRecord[]): string
