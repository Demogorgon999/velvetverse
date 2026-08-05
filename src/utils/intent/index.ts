export type UserIntent =
  | 'Greeting'
  | 'Gratitude'
  | 'Identity'
  | 'Lore'
  | 'Knowledge'
  | 'Memory'
  | 'Secrets'
  | 'Fears'
  | 'Motivations'
  | 'Affection'
  | 'Comfort'
  | 'Question'
  | 'Unknown'

function containsAny(
  text: string,
  phrases: string[],
) {
  return phrases.some((phrase) =>
    text.includes(phrase),
  )
}

export function detectIntent(
  message: string,
): UserIntent {
  const lower = message.toLowerCase()

  if (
    containsAny(lower, [
      'hello',
      'hi',
      'hey',
    ])
  ) {
    return 'Greeting'
  }

  if (
    containsAny(lower, [
      'thank you',
      'thanks',
      'appreciate',
    ])
  ) {
    return 'Gratitude'
  }

  if (
    containsAny(lower, [
      'how old',
      'who are you',
      'what are you',
      'where are you from',
      'what species',
      'are you human',
    ])
  ) {
    return 'Identity'
  }

  if (
    containsAny(lower, [
      'tell me about your past',
      'your story',
      'your history',
    ])
  ) {
    return 'Lore'
  }

  if (
    containsAny(lower, [
      'what do you know',
      'teach me',
    ])
  ) {
    return 'Knowledge'
  }

  if (
    containsAny(lower, [
      'what are you afraid of',
      'what do you fear',
      'what scares you',
    ])
  ) {
    return 'Fears'
  }

  if (
    containsAny(lower, [
      'what do you want',
      'what are your goals',
      'what is your goal',
      "what's your goal",
      'what is your purpose',
    ])
  ) {
    return 'Motivations'
  }

  if (
    containsAny(lower, [
      'remember my name',
      'what is my name',
      "what's my name",
      'do you remember my name',
    ])
  ) {
    return 'Memory'
  }

  if (
    containsAny(lower, [
      'secret',
      'what are you hiding',
    ])
  ) {
    return 'Secrets'
  }

  if (
    containsAny(lower, [
      'i love you',
      'i missed you',
      'i care about you',
    ])
  ) {
    return 'Affection'
  }

  if (
    containsAny(lower, [
      'i am sad',
      "i'm sad",
      'i need help',
      'i feel lonely',
      'i am lonely',
      "i'm lonely",
    ])
  ) {
    return 'Comfort'
  }

  if (lower.includes('?')) {
    return 'Question'
  }

  return 'Unknown'
}