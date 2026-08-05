import type { CharacterEngineContext } from '../characterEngine'
import type { CharacterReply } from '../../types/reply'
import type { UserIntent } from '../intent'
import type { DecisionResult } from '../decisionEngine'

export type ReplyHandlerArgs = {
  context: CharacterEngineContext
  characterName: string
  userMessage: string
  lowerMessage: string
  intent: UserIntent
  decision: DecisionResult
}

export type ReplyHandler = (
  args: ReplyHandlerArgs,
) => CharacterReply | null