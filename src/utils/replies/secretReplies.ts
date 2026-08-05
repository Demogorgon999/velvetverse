import type { ReplyHandler } from './types'
import { createReply } from './replyFactory'

export const getSecretReply: ReplyHandler = ({
  context,
  characterName,
  intent,
}) => {
  const {
    relationshipStage,
    brain,
  } = context

  if (intent !== 'Secrets') {
    return null
  }

  switch (relationshipStage) {
    case 'Hostile':
      return createReply(
        `${characterName} gives you a cold look. "I owe you no secrets."`,
        {
          emotion: 'Irritated',
          animation: 'idle',
          relationshipDelta: -1,
          internalThought:
            'They have not earned the right to ask me that.',
        },
      )

    case 'Stranger':
      return createReply(
        `${characterName} studies you carefully. "We barely know one another."`,
        {
          emotion: 'Suspicious',
          animation: 'thinking',
          internalThought:
            'They are asking for trust before earning it.',
        },
      )

    case 'Acquaintance':
      return createReply(
        `${characterName} lowers her voice slightly. "Perhaps when trust has had time to grow."`,
        {
          emotion: 'Suspicious',
          animation: 'thinking',
        },
      )

    case 'Friend':
    case 'Close Friend':
      return createReply(
        `${characterName} hesitates. "Perhaps... but not today."`,
        {
          emotion: 'Curious',
          animation: 'thinking',
          internalThought:
            'I trust them more than before, but not completely.',
        },
      )

    case 'Trusted':
    case 'Best Friend':
    case 'Soulmate': {
      const secret =
        brain.secrets.length > 0
          ? brain.secrets[
              Math.floor(
                Math.random() *
                  brain.secrets.length,
              )
            ]
          : undefined

      if (secret) {
        return createReply(
          `${characterName} lowers her voice. "${secret}"`,
          {
            emotion: 'Affectionate',
            animation: 'thinking',
            relationshipDelta: 1,
            typingDelay: 2600,
            internalThought:
              'I trust them enough to reveal something real.',
          },
        )
      }

      return createReply(
        `${characterName} gives a faint smile. "There are things I have never told another soul."`,
        {
          emotion: 'Affectionate',
          animation: 'smile',
          internalThought:
            'Some truths are still difficult to speak aloud.',
        },
      )
    }

    default:
      return null
  }
}