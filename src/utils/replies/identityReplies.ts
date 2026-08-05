import type { ReplyHandler } from './types'
import { createReply } from './replyFactory'

export const getIdentityReply: ReplyHandler = ({
  context,
  characterName,
  lowerMessage,
}) => {
  const { brain } = context

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
    )
  }

  if (
    lowerMessage.includes('what are you') ||
    lowerMessage.includes('what species are you') ||
    lowerMessage.includes('are you human')
  ) {
    return createReply(
      `${characterName} meets your gaze. "I am ${brain.identity.species}."`,
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
    )
  }

  if (
    lowerMessage.includes('what do you do') ||
    lowerMessage.includes('what is your role') ||
    lowerMessage.includes("what's your role") ||
    lowerMessage.includes('who are you really')
  ) {
    return createReply(
      `${characterName} answers, "I am ${brain.identity.role}."`,
    )
  }

  return null
}
