import type { CharacterEngineContext } from './characterEngine'
import type { UserIntent } from './intent'

export type CharacterDecision =
  | 'Allow'
  | 'Refuse'
  | 'Delay'
  | 'Deflect'
  | 'RevealMinor'
  | 'RevealMajor'

export type DecisionResult = {
  decision: CharacterDecision
  reason: string
  confidence: number
}

type MakeDecisionOptions = {
  context: CharacterEngineContext
  intent: UserIntent
}

export function makeCharacterDecision({
  context,
  intent,
}: MakeDecisionOptions): DecisionResult {
  const {
    relationshipStage,
    mood,
  } = context

  if (intent === 'Secrets') {
    switch (relationshipStage) {
      case 'Hostile':
        return {
          decision: 'Refuse',
          reason:
            'The character actively distrusts the user.',
          confidence: 1,
        }

      case 'Stranger':
        return {
          decision: 'Refuse',
          reason:
            'The relationship is too new for private information.',
          confidence: 0.95,
        }

      case 'Acquaintance':
        return {
          decision: 'Delay',
          reason:
            'Some trust exists, but not enough for disclosure.',
          confidence: 0.85,
        }

      case 'Friend':
      case 'Close Friend':
        return {
          decision: 'RevealMinor',
          reason:
            'The character trusts the user enough for a small secret.',
          confidence: 0.8,
        }

      case 'Trusted':
      case 'Best Friend':
        return {
          decision: 'RevealMajor',
          reason:
            'The relationship supports a deeply personal disclosure.',
          confidence: 0.9,
        }

      case 'Soulmate':
        return {
          decision: 'RevealMajor',
          reason:
            'The character has complete emotional trust in the user.',
          confidence: 1,
        }
    }
  }

  if (intent === 'Affection') {
    if (
      relationshipStage === 'Hostile' ||
      relationshipStage === 'Stranger'
    ) {
      return {
        decision: 'Deflect',
        reason:
          'The emotional advance is too strong for the current relationship.',
        confidence: 0.9,
      }
    }

    return {
      decision: 'Allow',
      reason:
        'The current relationship allows an affectionate response.',
      confidence: 0.9,
    }
  }

  if (intent === 'Comfort') {
    if (mood.mood === 'Irritated') {
      return {
        decision: 'Delay',
        reason:
          'The character wants to help but is emotionally unsettled.',
        confidence: 0.75,
      }
    }

    return {
      decision: 'Allow',
      reason:
        'The character is willing to provide emotional support.',
      confidence: 0.95,
    }
  }

  return {
    decision: 'Allow',
    reason:
      'No special restriction applies to this request.',
    confidence: 0.7,
  }
}