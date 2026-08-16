import type {
  RelationshipStage,
} from './memory'

import type {
  UserIntent,
} from './intent'

import type {
  DecisionResult,
} from './decisionEngine'

import type {
  ConversationHistoryMessage,
} from './replies/types'

type RelationshipEffectArgs = {
  userMessage: string

  intent: UserIntent

  decision: DecisionResult

  relationshipStage:
    RelationshipStage

  conversationHistory:
    ConversationHistoryMessage[]
}

function containsAny(
  text: string,
  phrases: string[],
) {
  return phrases.some(
    (phrase) =>
      text.includes(phrase),
  )
}

function isShortAgreement(
  text: string,
) {
  const cleaned =
    text
      .toLowerCase()
      .trim()

  return [
    'yes',
    'yes i am',
    'yes i do',
    'i am',
    'i will',
    'i would',
    'of course',
    'absolutely',
    'always',
    'i promise',
  ].includes(cleaned)
}

function previousCharacterMessageIsRelational(
  conversationHistory:
    ConversationHistoryMessage[],
) {
  const previousCharacterMessage =
    [...conversationHistory]
      .reverse()
      .find(
        (message) =>
          message.sender ===
          'character',
      )

  if (!previousCharacterMessage) {
    return false
  }

  const lower =
    previousCharacterMessage.text
      .toLowerCase()

  return containsAny(
    lower,
    [
      'trust',
      'walk beside me',
      'stay with me',
      'stand beside me',
      'with me',
      'together',
      'promise',
      'care for me',
      'feel about me',
      'ready to',
      'are you prepared',
      'will you',
      'would you',
    ],
  )
}

export function calculateRelationshipDelta({
  userMessage,
  intent,
  decision,
  relationshipStage,
  conversationHistory,
}: RelationshipEffectArgs) {
  const lower =
    userMessage
      .toLowerCase()
      .trim()

  if (
    containsAny(
      lower,
      [
        'i hate you',
        'you are awful',
        "you're awful",
        'you are useless',
        "you're useless",
        'leave me alone',
        'i despise you',
      ],
    )
  ) {
    return -2
  }

  if (
    containsAny(
      lower,
      [
        'you annoy me',
        'i do not trust you',
        "i don't trust you",
        'i dislike you',
      ],
    )
  ) {
    return -1
  }

  if (
    isShortAgreement(
      lower,
    ) &&
    previousCharacterMessageIsRelational(
      conversationHistory,
    )
  ) {
    return 1
  }

  const strongAffection =
    containsAny(
      lower,
      [
        'i love you',
        'i want to be with you',
        'be with you forever',
        'want to stay with you',
        'you mean a lot to me',
        'i care about you',
        'i trust you',
        'i missed you',
        'i want us to be together',
        'i will stand beside you',
        'i will stay with you',
      ],
    )

  if (strongAffection) {
    if (
      relationshipStage ===
      'Hostile'
    ) {
      return 0
    }

    return 1
  }

  if (
    intent === 'Affection'
  ) {
    if (
      relationshipStage ===
      'Hostile'
    ) {
      return 0
    }

    if (
      decision.decision ===
      'Refuse'
    ) {
      return 0
    }

    return 1
  }

  if (
    containsAny(
      lower,
      [
        'thank you',
        'thanks',
        'i appreciate you',
        'you are kind',
        "you're kind",
      ],
    )
  ) {
    return 1
  }

  return 0
}