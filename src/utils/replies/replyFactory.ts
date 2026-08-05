import type {
  CharacterEmotion,
  CharacterReply,
  ReplyAnimation,
} from '../../types/reply'

export type ReplyOptions = {
  emotion?: CharacterEmotion
  animation?: ReplyAnimation
  typingDelay?: number
  relationshipDelta?: number
  moodDelta?: number
  internalThought?: string
}

function calculateTypingDelay(text: string) {
  const estimatedDelay = 900 + text.length * 12

  return Math.max(
    1100,
    Math.min(3600, estimatedDelay),
  )
}

export function createReply(
  text: string,
  options: ReplyOptions = {},
): CharacterReply {
  return {
    text,
    emotion: options.emotion ?? 'Neutral',
    animation: options.animation ?? 'idle',
    typingDelay:
      options.typingDelay ??
      calculateTypingDelay(text),
    relationshipDelta:
      options.relationshipDelta ?? 0,
    moodDelta: options.moodDelta ?? 0,
    internalThought: options.internalThought,
  }
}
