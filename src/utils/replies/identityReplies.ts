import type { ReplyHandler } from './types'
import { createReply } from './replyFactory'

export const getIdentityReply: ReplyHandler = ({
  context,
  characterName,
  lowerMessage,
  intent,
  emotion,
}) => {
  const { brain } = context

  if (intent !== 'Identity') {
    return null
  }

  if (
    lowerMessage.includes('how old are you') ||
    lowerMessage.includes('what is your age') ||
    lowerMessage.includes("what's your age") ||
    lowerMessage.includes('how long have you been alive') ||
    lowerMessage.includes(
      'how long have you been a vampire',
    )
  ) {
    return createReply(
      `${characterName} answers calmly. "I am ${brain.identity.age}."`,
      {
  emotion: emotion.emotion,
  animation: emotion.animation,
},
    )
  }

  if (
    lowerMessage.includes('where are you from') ||
    lowerMessage.includes('where do you come from') ||
    lowerMessage.includes('what is your homeland') ||
    lowerMessage.includes("what's your homeland")
  ) {
    return createReply(
      `${characterName} replies, "I come from ${brain.identity.homeland}."`,
      {
  emotion: emotion.emotion,
  animation: emotion.animation,
},
    )
  }

  if (
    lowerMessage.includes('what do you do') ||
    lowerMessage.includes('what is your role') ||
    lowerMessage.includes("what's your role") ||
    lowerMessage.includes('what is your occupation') ||
    lowerMessage.includes("what's your occupation") ||
    lowerMessage.includes('who are you really') ||
    lowerMessage.includes('who are you')
  ) {
    return createReply(
      `${characterName} answers, "I am ${brain.identity.role}."`,
      {
        emotion: 'Curious',
        animation: 'idle',
      },
    )
  }

  if (
    lowerMessage.includes('what are you') ||
    lowerMessage.includes('what species are you') ||
    lowerMessage.includes('are you human')
  ) {
    return createReply(
      `${characterName} meets your gaze. "I am ${brain.identity.species}."`,
      {
        emotion: 'Curious',
        animation: 'idle',
      },
    )
  }

  return createReply(
    `${characterName} replies, "I am ${brain.identity.role}, a ${brain.identity.species} from ${brain.identity.homeland}."`,
    {
      emotion: 'Curious',
      animation: 'idle',
    },
  )
}