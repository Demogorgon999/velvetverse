import type { ReplyHandler } from './types'
import { createReply } from './replyFactory'

export const getGreetingReply: ReplyHandler = ({
  context,
  characterName,
  userMessage,
}) => {
  const { memory } = context

  const isGreeting =
    /\b(hello|hi|hey)\b/i.test(userMessage)

  if (!isGreeting) {
    return null
  }

  if (memory.userName) {
    return createReply(
      `${characterName} regards you warmly. "Welcome back, ${memory.userName}. It is good to see you again."`,
      {
        emotion: 'Happy',
        animation: 'smile',
        relationshipDelta: 1,
        internalThought:
          'I am genuinely pleased that they returned.',
      },
    )
  }

  return createReply(
    `${characterName} regards you with quiet interest. "Greetings, traveler."`,
    {
      emotion: 'Curious',
      animation: 'idle',
      internalThought:
        'A new conversation begins. I wonder what they want.',
    },
  )
}
