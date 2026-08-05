import type { ReplyHandler } from './types'
import { createReply } from './replyFactory'

export const getLoreReply: ReplyHandler = ({
  context,
  characterName,
  lowerMessage,
}) => {
  const { brain } = context

  if (
    lowerMessage.includes('tell me about your past') ||
    lowerMessage.includes('tell me your story') ||
    lowerMessage.includes('what happened to you') ||
    lowerMessage.includes('tell me about your history')
  ) {
    return createReply(
      `${characterName} grows thoughtful. "${brain.lore.join(
        ' ',
      )}"`,
      {
        emotion: 'Sad',
        animation: 'thinking',
        typingDelay: 3200,
        internalThought:
          'The past is never as distant as I pretend.',
      },
    )
  }

  if (
    lowerMessage.includes('what do you know') ||
    lowerMessage.includes(
      'what are you knowledgeable about',
    ) ||
    lowerMessage.includes('what can you teach me') ||
    lowerMessage.includes('what subjects do you know')
  ) {
    return createReply(
      `${characterName} replies, "I know much about ${brain.knowledge.join(
        ', ',
      )}."`,
      {
        emotion: 'Curious',
        animation: 'thinking',
      },
    )
  }

  if (
    lowerMessage.includes('what are you afraid of') ||
    lowerMessage.includes('what do you fear') ||
    lowerMessage.includes('what scares you')
  ) {
    return createReply(
      `${characterName} hesitates before answering. "I fear ${brain.fears.join(
        ', ',
      )}."`,
      {
        emotion: 'Concerned',
        animation: 'concern',
        typingDelay: 2600,
        internalThought:
          'Admitting fear makes me feel exposed.',
      },
    )
  }

  if (
    lowerMessage.includes('what do you want') ||
    lowerMessage.includes('what is your goal') ||
    lowerMessage.includes("what's your goal") ||
    lowerMessage.includes('what are your goals') ||
    lowerMessage.includes('what is your purpose')
  ) {
    return createReply(
      `${characterName} replies, "My ambitions are to ${brain.motivations.join(
        ', ',
      )}."`,
      {
        emotion: 'Curious',
        animation: 'thinking',
      },
    )
  }

  return null
}
