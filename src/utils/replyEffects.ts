import type { CharacterReply } from '../types/reply'

import {
  getCharacterMemory,
  saveCharacterMemory,
} from './memory'

export function applyReplyEffects(
  characterId: number,
  reply: CharacterReply,
) {
  // Nothing to update
  if (
    reply.relationshipDelta === 0 &&
    reply.moodDelta === 0
  ) {
    return
  }

  const memory =
    getCharacterMemory(characterId)

  // Update relationship score
  memory.relationshipScore +=
    reply.relationshipDelta

  // Clamp between -10 and 10
  memory.relationshipScore = Math.max(
    -10,
    Math.min(10, memory.relationshipScore),
  )

  // Save updated memory
  saveCharacterMemory(
    characterId,
    memory,
  )

  // ------------------------------------------------------------------
  // Mood changes will be handled here later.
  //
  // Eventually this function will also:
  //
  // • update moods
  // • save internal thoughts
  // • create diary entries
  // • unlock relationship events
  // • trigger world events
  // • notify the UI
  //
  // ChatPage will never need to know any of this.
  // ------------------------------------------------------------------
}