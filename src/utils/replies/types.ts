import type { CharacterEngineContext } from '../characterEngine'
import type { CharacterReply } from '../../types/reply'

export type ReplyHandlerArgs = {
  context: CharacterEngineContext
  characterName: string
  userMessage: string
  lowerMessage: string
}

export type ReplyHandler = (
  args: ReplyHandlerArgs,
) => CharacterReply | null