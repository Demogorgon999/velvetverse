import type {
  CharacterEngineContext,
} from '../characterEngine'

import type {
  CharacterReply,
} from '../../types/reply'

import type {
  UserIntent,
} from '../intent'

import type {
  DecisionResult,
} from '../decisionEngine'

import type {
  EmotionResult,
} from '../emotionEngine'

import type {
  ResponsePlan,
} from '../responsePlanner'

export type ConversationHistoryMessage = {
  sender: 'user' | 'character'
  text: string
}

export type ReplyHandlerArgs = {
  signal?: AbortSignal
  context: CharacterEngineContext
  characterName: string
  userMessage: string
  lowerMessage: string

  conversationHistory:
    ConversationHistoryMessage[]

  intent: UserIntent

  decision: DecisionResult

  emotion: EmotionResult

  responsePlan: ResponsePlan
}

export type ReplyHandler = (
  args: ReplyHandlerArgs,
) => CharacterReply | null
