import type { ReplyHandler } from './types'
import { createReply } from './replyFactory'
import {
  applyTypingDelayModifier,
} from '../emotionEngine'

export const getSecretReply: ReplyHandler = ({
  characterName,
  intent,
  responsePlan,
}) => {
  if (intent !== 'Secrets') {
    return null
  }

  const {
    decision,
    emotion,
    relevantSecrets,
    internalThought,
  } = responsePlan

  switch (decision.decision) {
    case 'Refuse':
      return createReply(
        `${characterName} gives you a guarded look. "I owe you no secrets."`,
        {
          emotion: emotion.emotion,
          animation: emotion.animation,
          relationshipDelta: -1,
          typingDelay: applyTypingDelayModifier(
            1800,
            emotion.typingDelayModifier,
          ),
          internalThought,
        },
      )

    case 'Delay':
      return createReply(
        `${characterName} lowers her voice slightly. "Perhaps when trust has had time to grow."`,
        {
          emotion: emotion.emotion,
          animation: emotion.animation,
          typingDelay: applyTypingDelayModifier(
            2100,
            emotion.typingDelayModifier,
          ),
          internalThought,
        },
      )

    case 'Deflect':
      return createReply(
        `${characterName} gives a faint smile. "There are safer subjects we could discuss."`,
        {
          emotion: emotion.emotion,
          animation: emotion.animation,
          typingDelay: applyTypingDelayModifier(
            1900,
            emotion.typingDelayModifier,
          ),
          internalThought,
        },
      )

    case 'RevealMinor': {
      const secret = relevantSecrets[0]

      return createReply(
        secret
          ? `${characterName} hesitates before speaking. "${secret}"`
          : `${characterName} hesitates. "There is little I am ready to reveal."`,
        {
          emotion: emotion.emotion,
          animation: emotion.animation,
          relationshipDelta: 1,
          typingDelay: applyTypingDelayModifier(
            2300,
            emotion.typingDelayModifier,
          ),
          internalThought,
        },
      )
    }

    case 'RevealMajor': {
      const secret =
        relevantSecrets.length > 0
          ? relevantSecrets[
              Math.floor(
                Math.random() *
                  relevantSecrets.length,
              )
            ]
          : undefined

      return createReply(
        secret
          ? `${characterName} lowers her voice. "${secret}"`
          : `${characterName} gives a faint smile. "There are things I have never told another soul."`,
        {
          emotion: emotion.emotion,
          animation: emotion.animation,
          relationshipDelta: 1,
          typingDelay: applyTypingDelayModifier(
            2700,
            emotion.typingDelayModifier,
          ),
          internalThought,
        },
      )
    }

    case 'Allow':
      return createReply(
        `${characterName} studies you for a moment. "Perhaps there is something I can tell you."`,
        {
          emotion: emotion.emotion,
          animation: emotion.animation,
          typingDelay: applyTypingDelayModifier(
            2000,
            emotion.typingDelayModifier,
          ),
          internalThought,
        },
      )

    default:
      return null
  }
}