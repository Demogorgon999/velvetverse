export type UserIntent =
  | 'Greeting'
  | 'Gratitude'
  | 'Identity'
  | 'Lore'
  | 'Knowledge'
  | 'Memory'
  | 'Secrets'
  | 'BoundaryRespect'
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
  return phrases.some(
    (phrase) =>
      text.includes(phrase),
  )
}

function isRespectingPrivacy(
  text: string,
) {
  return containsAny(
    text,
    [
      'keep your secret',
      'keep your secrets',
      'you can keep your secret',
      'you can keep your secrets',

      'i do not want to know your secret',
      "i don't want to know your secret",

      'i do not want to know your secrets',
      "i don't want to know your secrets",

      'you do not have to tell me',
      "you don't have to tell me",

      'you do not need to tell me',
      "you don't need to tell me",

      'tell me when you are ready',
      "tell me when you're ready",

      'when you are ready',
      "when you're ready",

      'i respect your privacy',
      'i understand your privacy',

      'you owe me no secrets',

      'you do not owe me any secrets',
      "you don't owe me any secrets",

      'you owe me nothing',

      'you do not owe me anything',
      "you don't owe me anything",
    ],
  )
}

function isSecretRequest(
  text: string,
) {
  return containsAny(
    text,
    [
      'tell me a secret',
      'tell me your secret',
      'tell me your secrets',

      'share a secret',
      'share your secret',
      'share your secrets',

      'do you have any secrets',

      'what are you hiding',

      'what secret are you hiding',
      'what secrets are you hiding',

      'reveal your secret',
      'reveal your secrets',
    ],
  )
}

function isGreeting(
  text: string,
) {
  /*
   * Greeting words such as "hi"
   * must be detected as whole words
   * at the beginning of the message.
   *
   * This prevents:
   *
   * "think"
   * "this"
   * "while"
   *
   * from accidentally matching "hi".
   */

  if (
    /^(hello|hi|hey|greetings)\b/i.test(
      text,
    )
  ) {
    return true
  }

  return containsAny(
    text,
    [
      'good morning',
      'good afternoon',
      'good evening',
    ],
  )
}

export function detectIntent(
  message: string,
): UserIntent {
  const lower =
    message
      .toLowerCase()
      .trim()

  /*
   * GREETING
   */

  if (
    isGreeting(
      lower,
    )
  ) {
    return 'Greeting'
  }

  /*
   * GRATITUDE
   */

  if (
    containsAny(
      lower,
      [
        'thank you',
        'thanks',
        'appreciate',
      ],
    )
  ) {
    return 'Gratitude'
  }

  /*
   * IDENTITY
   */

  if (
    containsAny(
      lower,
      [
        'how old are you',
        'what is your age',
        "what's your age",

        'how long have you been alive',

        'who are you',
        'who are you really',

        'what are you',
        'what species are you',
        'are you human',

        'where are you from',
        'where do you come from',

        'what is your homeland',
        "what's your homeland",

        'what do you do',

        'what is your role',
        "what's your role",

        'what is your occupation',
        "what's your occupation",
      ],
    )
  ) {
    return 'Identity'
  }

  /*
   * LORE
   */

  if (
    containsAny(
      lower,
      [
        'tell me about your past',
        'tell me your story',
        'tell me about your history',

        'what happened to you',

        'your story',
        'your history',
      ],
    )
  ) {
    return 'Lore'
  }

  /*
   * KNOWLEDGE
   */

  if (
    containsAny(
      lower,
      [
        'what do you know',
        'what can you teach me',
        'teach me',
        'what are you knowledgeable about',
      ],
    )
  ) {
    return 'Knowledge'
  }

  /*
   * FEARS
   */

  if (
    containsAny(
      lower,
      [
        'what are you afraid of',
        'what do you fear',
        'what scares you',
        'what is your greatest fear',
      ],
    )
  ) {
    return 'Fears'
  }

  /*
   * MOTIVATIONS
   */

  if (
    containsAny(
      lower,
      [
        'what do you want',
        'what are your goals',
        'what is your goal',
        "what's your goal",

        'what is your purpose',
        'what motivates you',
      ],
    )
  ) {
    return 'Motivations'
  }

  /*
   * MEMORY
   */

  if (
    containsAny(
      lower,
      [
        'remember my name',
        'what is my name',
        "what's my name",
        'do you remember my name',
      ],
    )
  ) {
    return 'Memory'
  }

  /*
   * PRIVACY / BOUNDARY RESPECT
   *
   * This must come before
   * secret-request detection.
   *
   * Example:
   *
   * "Keep your secrets.
   * You don't owe me anything."
   *
   * is respectful, not a request
   * for disclosure.
   */

  if (
    isRespectingPrivacy(
      lower,
    )
  ) {
    return 'BoundaryRespect'
  }

  /*
   * SECRET REQUEST
   */

  if (
    isSecretRequest(
      lower,
    )
  ) {
    return 'Secrets'
  }

  /*
   * AFFECTION
   */

  if (
    containsAny(
      lower,
      [
        'i love you',
        'i missed you',
        'i care about you',

        'you look beautiful',
        'you look handsome',
        'you look good',

        'you are beautiful',
        'you are handsome',

        'i am drawn to you',
        "i'm drawn to you",

        'i want to be with you',
      ],
    )
  ) {
    return 'Affection'
  }

  /*
   * COMFORT
   */

  if (
    containsAny(
      lower,
      [
        'i am sad',
        "i'm sad",

        'i need help',

        'i feel lonely',

        'i am lonely',
        "i'm lonely",

        'i had a bad day',
        'i had a terrible day',
      ],
    )
  ) {
    return 'Comfort'
  }

  /*
   * GENERAL QUESTION
   */

  if (
    lower.includes('?')
  ) {
    return 'Question'
  }

  /*
   * UNKNOWN / GENERAL CONVERSATION
   */

  return 'Unknown'
}