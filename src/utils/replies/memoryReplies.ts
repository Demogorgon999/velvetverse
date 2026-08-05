import type { ReplyHandler } from './types'
import { createReply } from './replyFactory'

export const getMemoryReply: ReplyHandler = ({
  context,
  characterName,
  intent,
}) => {
  const { memory } = context

  if (intent !== 'Memory') {
    return null
  }

  if (memory.userName) {
    return createReply(
      `${characterName} smiles softly. "Your name is ${memory.userName}. I remember."`,
      {
        emotion: 'Happy',
        animation: 'smile',
        relationshipDelta: 1,
        internalThought:
          'Of course I remember their name.',
      },
    )
  }

  return createReply(
    `${characterName} tilts her head. "You have not told me your name yet."`,
    {
      emotion: 'Curious',
      animation: 'thinking',
    },
  )
}