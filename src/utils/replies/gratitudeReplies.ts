import type { ReplyHandler } from './types'
import { createReply } from './replyFactory'

export const getGratitudeReply: ReplyHandler = ({
  context,
  characterName,
  intent,
}) => {
  const { mood } = context

  if (intent !== 'Gratitude') {
    return null
  }

  if (mood.mood === 'Affectionate') {
    return createReply(
      `"You never need to thank me," ${characterName} says warmly.`,
      {
        emotion: 'Affectionate',
        animation: 'smile',
        relationshipDelta: 1,
        moodDelta: 1,
        internalThought:
          'Their appreciation means more to me than I expected.',
      },
    )
  }

  return createReply(
    `${characterName} gives a small nod. "You are welcome."`,
    {
      emotion: 'Happy',
      animation: 'smile',
      relationshipDelta: 1,
    },
  )
}