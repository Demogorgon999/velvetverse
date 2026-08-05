import type { CharacterEngineContext } from '../characterEngine'
import type { CharacterReply } from '../../types/reply'
import type {
  ReplyHandler,
  ReplyHandlerArgs,
} from './types'
import { getGreetingReply } from './greetingReplies'
import { getGratitudeReply } from './gratitudeReplies'
import { getSecretReply } from './secretReplies'
import { getIdentityReply } from './identityReplies'
import { getLoreReply } from './loreReplies'
import { getMemoryReply } from './memoryReplies'
import { getFallbackReply } from './fallbackReplies'

const replyHandlers: ReplyHandler[] = [
  getGreetingReply,
  getGratitudeReply,
  getSecretReply,
  getIdentityReply,
  getLoreReply,
  getMemoryReply,
]

export function getCharacterReply(
  context: CharacterEngineContext,
  characterName: string,
  userMessage: string,
): CharacterReply {
  const args: ReplyHandlerArgs = {
    context,
    characterName,
    userMessage,
    lowerMessage: userMessage.toLowerCase(),
  }

  for (const handler of replyHandlers) {
    const reply = handler(args)

    if (reply) {
      return reply
    }
  }

  const fallbackReply = getFallbackReply(args)

  if (!fallbackReply) {
    throw new Error(
      'The fallback reply handler did not return a reply.',
    )
  }

  return fallbackReply
}
