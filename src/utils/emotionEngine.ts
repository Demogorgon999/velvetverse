import type {
  CharacterEmotion,
  ReplyAnimation,
} from '../types/reply'
import type { MoodState } from './mood'
import type { RelationshipStage } from './memory'

export type EmotionResult = {
  emotion: CharacterEmotion
  animation: ReplyAnimation
  typingDelayModifier: number
  reason: string
}

type DetectEmotionOptions = {
  userMessage: string
  mood: MoodState
  relationshipStage: RelationshipStage
}

function containsAny(
  text: string,
  phrases: string[],
) {
  return phrases.some((phrase) =>
    text.includes(phrase),
  )
}

export function detectCharacterEmotion({
  userMessage,
  mood,
  relationshipStage,
}: DetectEmotionOptions): EmotionResult {
  const lowerMessage =
    userMessage.toLowerCase()

  if (
    containsAny(lowerMessage, [
      'i am sad',
      "i'm sad",
      'i feel sad',
      'i am lonely',
      "i'm lonely",
      'i feel lonely',
      'i am hurt',
      "i'm hurt",
      'i had a terrible day',
      'i had a bad day',
    ])
  ) {
    return {
      emotion: 'Concerned',
      animation: 'concern',
      typingDelayModifier: 350,
      reason:
        'The user appears emotionally vulnerable.',
    }
  }

  if (
    containsAny(lowerMessage, [
      'i missed you',
      'i love you',
      'i care about you',
      'you mean a lot to me',
      'you are special to me',
    ])
  ) {
    if (
      relationshipStage === 'Trusted' ||
      relationshipStage === 'Best Friend' ||
      relationshipStage === 'Soulmate'
    ) {
      return {
        emotion: 'Affectionate',
        animation: 'smile',
        typingDelayModifier: 500,
        reason:
          'The user expressed affection within a close relationship.',
      }
    }

    return {
      emotion: 'Curious',
      animation: 'thinking',
      typingDelayModifier: 250,
      reason:
        'The user expressed affection before deep trust has formed.',
    }
  }

  if (
    containsAny(lowerMessage, [
      'you are beautiful',
      "you're beautiful",
      'you are pretty',
      "you're pretty",
      'you look amazing',
      'you look lovely',
    ])
  ) {
    return {
      emotion: 'Playful',
      animation: 'smile',
      typingDelayModifier: 200,
      reason:
        'The user gave the character a personal compliment.',
    }
  }

  if (
    containsAny(lowerMessage, [
      'tell me a secret',
      'what are you hiding',
      'do you trust me',
      'are you lying',
      'tell me the truth',
    ])
  ) {
    return {
      emotion: 'Suspicious',
      animation: 'thinking',
      typingDelayModifier: 300,
      reason:
        'The user pressed for private or sensitive information.',
    }
  }

  if (
    containsAny(lowerMessage, [
      'i hate you',
      'you are awful',
      "you're awful",
      'leave me alone',
      'shut up',
      'you are useless',
      "you're useless",
    ])
  ) {
    return {
      emotion: 'Irritated',
      animation: 'idle',
      typingDelayModifier: -150,
      reason:
        'The user became hostile or insulting.',
    }
  }

  if (
    containsAny(lowerMessage, [
      'thank you',
      'thanks',
      'i appreciate you',
      'you are kind',
      "you're kind",
    ])
  ) {
    return {
      emotion: 'Happy',
      animation: 'smile',
      typingDelayModifier: 150,
      reason:
        'The user expressed appreciation.',
    }
  }

  if (
    containsAny(lowerMessage, [
      'why',
      'how',
      'what do you think',
      'tell me more',
      'explain',
      'what happened',
    ])
  ) {
    return {
      emotion: 'Curious',
      animation: 'thinking',
      typingDelayModifier: 250,
      reason:
        'The user encouraged deeper discussion.',
    }
  }

  switch (mood.mood) {
    case 'Affectionate':
      return {
        emotion: 'Affectionate',
        animation: 'smile',
        typingDelayModifier: 200,
        reason:
          'The character is currently in an affectionate mood.',
      }

    case 'Protective':
      return {
        emotion: 'Protective',
        animation: 'concern',
        typingDelayModifier: 250,
        reason:
          'The character is currently feeling protective.',
      }

    case 'Playful':
      return {
        emotion: 'Playful',
        animation: 'smile',
        typingDelayModifier: 100,
        reason:
          'The character is currently in a playful mood.',
      }

    case 'Curious':
      return {
        emotion: 'Curious',
        animation: 'thinking',
        typingDelayModifier: 200,
        reason:
          'The character is currently curious.',
      }

    case 'Irritated':
      return {
        emotion: 'Irritated',
        animation: 'idle',
        typingDelayModifier: -100,
        reason:
          'The character is currently irritated.',
      }

    case 'Suspicious':
      return {
        emotion: 'Suspicious',
        animation: 'thinking',
        typingDelayModifier: 200,
        reason:
          'The character is currently suspicious.',
      }

    case 'Sad':
      return {
        emotion: 'Sad',
        animation: 'concern',
        typingDelayModifier: 350,
        reason:
          'The character is currently sad.',
      }

    case 'Calm':
    default:
      return {
        emotion: 'Neutral',
        animation: 'idle',
        typingDelayModifier: 0,
        reason:
          'The conversation has not triggered a stronger immediate emotion.',
      }
  }
}

export function applyTypingDelayModifier(
  baseTypingDelay: number,
  modifier: number,
) {
  return Math.max(
    800,
    Math.min(
      4500,
      baseTypingDelay + modifier,
    ),
  )
}