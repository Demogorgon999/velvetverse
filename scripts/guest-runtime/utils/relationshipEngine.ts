import {
  getCharacterPersonality,
} from './personality'

import {
  getCharacterRelationship,
  applyRelationshipChanges,
} from './relationship'

import {
  assessInteractionSemantically,
} from '../services/interactionAssessmentService'
import {
  evaluateChemistryInteraction,
} from './chemistryEngine'

import {
  rememberPerceivedInteraction,
} from './memory'

import type {
  ChemistryEvaluation,
} from './chemistryEngine'

import type {
  CharacterEngineContext,
} from './characterEngine'

import type {
  RelationshipChanges,
  RelationshipState,
} from './relationship'

import type {
  InteractionAssessment,
} from './interactionAssessment'

import type {
  ConversationHistoryMessage,
} from './replies/types'

import type {
  PerceptionState,
} from './intent/perceptionEngine'


type RelationshipEvaluationArgs = {
  signal?: AbortSignal
  context:
    CharacterEngineContext

  characterName:
    string

  userMessage:
    string

  conversationHistory:
    ConversationHistoryMessage[]

  perceptionState:
    PerceptionState
}


export type RelationshipEvaluation = {
  before:
    RelationshipState

  assessment:
    InteractionAssessment

  chemistry:
    ChemistryEvaluation

  changes:
    RelationshipChanges

  after:
    RelationshipState

  reason:
    string[]
}


type PositiveRelationshipKey =
  | 'trust'
  | 'affection'
  | 'attraction'
  | 'respect'
  | 'comfort'


const positiveKeys:
  PositiveRelationshipKey[] = [
    'trust',
    'affection',
    'attraction',
    'respect',
    'comfort',
  ]


function hasTrait(
  traits: string[],
  phrase: string,
) {
  return traits.some(
    (trait) =>
      trait
        .toLowerCase()
        .includes(
          phrase.toLowerCase(),
        ),
  )
}


function addChange(
  changes:
    RelationshipChanges,

  key:
    keyof RelationshipChanges,

  amount:
    number,
) {
  changes[key] =
    (changes[key] ?? 0) +
    amount
}


function normalizeMessage(
  text: string,
) {
  return text
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      ' ',
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim()
}


function getRecentRepetitionFactor(
  userMessage: string,

  conversationHistory:
    ConversationHistoryMessage[],
) {
  const current =
    normalizeMessage(
      userMessage,
    )

  if (!current) {
    return 1
  }

  const recentUserMessages =
    conversationHistory
      .filter(
        (message) =>
          message.sender ===
          'user',
      )
      .slice(-6)
      .map(
        (message) =>
          normalizeMessage(
            message.text,
          ),
      )
      .filter(Boolean)

  const exactRepeat =
    recentUserMessages.some(
      (message) =>
        message === current,
    )

  if (
    exactRepeat
  ) {
    return 0.15
  }

  /*
   * Basic anti-spam similarity check.
   *
   * This does NOT determine emotional
   * meaning. Ollama still handles that.
   *
   * It only prevents almost-identical
   * messages from repeatedly farming
   * relationship progression.
   */

  const currentWords =
    new Set(
      current.split(' '),
    )

  for (
    const previous of
    recentUserMessages
  ) {
    const previousWords =
      new Set(
        previous.split(' '),
      )

    let shared = 0

    for (
      const word of
      currentWords
    ) {
      if (
        previousWords.has(
          word,
        )
      ) {
        shared += 1
      }
    }

    const totalUnique =
      new Set([
        ...currentWords,
        ...previousWords,
      ]).size

    if (
      totalUnique === 0
    ) {
      continue
    }

    const similarity =
      shared /
      totalUnique

    if (
      similarity >=
      0.75
    ) {
      return 0.35
    }
  }

  return 1
}


function getStageGrowthMultiplier(
  context:
    CharacterEngineContext,
) {
  /*
   * Deeper relationships become
   * progressively harder to advance.
   */

  switch (
    context.relationshipStage
  ) {
    case 'Hostile':
      return 0.45

    case 'Stranger':
      return 1

    case 'Acquaintance':
      return 0.8

    case 'Friend':
      return 0.65

    case 'Close Friend':
      return 0.5

    case 'Trusted':
      return 0.4

    case 'Best Friend':
      return 0.3

    case 'Soulmate':
      return 0.2

    default:
      return 1
  }
}


function getPositiveInteractionStrength(
  assessment:
    InteractionAssessment,
) {
  return Math.max(
    assessment.supportive,
    assessment.respectful,
    assessment.flirtatious,
    assessment.romantic,
    assessment.vulnerable,
    assessment.loyal,
    assessment.playful,
    assessment.socialInvitation,
  )
}


function getPositiveBudget(
  assessment:
    InteractionAssessment,

  context:
    CharacterEngineContext,

  repetitionFactor:
    number,
) {
  const strongest =
    getPositiveInteractionStrength(
      assessment,
    )

  if (
    strongest <
    0.4
  ) {
    return 0
  }

  let budget = 0.45

  if (
    strongest >=
    0.6
  ) {
    budget = 0.7
  }

  if (
    strongest >=
    0.8
  ) {
    budget = 1
  }

  const meaningfulEmotionalMoment =
    Math.max(
      assessment.supportive,
      assessment.vulnerable,
      assessment.loyal,
    )

  if (
    meaningfulEmotionalMoment >=
    0.8
  ) {
    budget += 0.35
  }

  if (
    assessment.pressuring >=
      0.5 ||
    assessment.rude >=
      0.6 ||
    assessment.hostile >=
      0.4
  ) {
    budget *= 0.3
  }

  budget *=
    getStageGrowthMultiplier(
      context,
    )

  budget *=
    repetitionFactor

  return Math.max(
    0,
    budget,
  )
}


function governPositiveProgression(
  rawChanges:
    RelationshipChanges,

  assessment:
    InteractionAssessment,

  context:
    CharacterEngineContext,

  repetitionFactor:
    number,
) {
  const governed:
    RelationshipChanges = {
      ...rawChanges,
    }

  const budget =
    getPositiveBudget(
      assessment,
      context,
      repetitionFactor,
    )

  let requestedPositive = 0

  for (
    const key of
    positiveKeys
  ) {
    const value =
      rawChanges[key] ?? 0

    if (
      value > 0
    ) {
      requestedPositive +=
        value
    }
  }

  if (
    requestedPositive <= 0
  ) {
    return governed
  }

  const scale =
    requestedPositive >
    budget
      ? budget /
        requestedPositive
      : 1

  for (
    const key of
    positiveKeys
  ) {
    const value =
      rawChanges[key]

    if (
      typeof value ===
        'number' &&
      value > 0
    ) {
      governed[key] =
        Number(
          (
            value *
            scale
          ).toFixed(
            2,
          ),
        )
    }
  }

  if (
    typeof governed.caution ===
      'number' &&
    governed.caution < 0
  ) {
    const maximumCautionReduction =
      0.5 *
      getStageGrowthMultiplier(
        context,
      ) *
      repetitionFactor

    governed.caution =
      Math.max(
        governed.caution,
        -maximumCautionReduction,
      )
  }

  return governed
}


/*
 * ================================================================
 * PERCEIVED INTERACTION
 * ================================================================
 *
 * Relationship effects may only come
 * from things the character actually
 * heard or visibly observed.
 *
 * Private thoughts, hidden narration
 * and unseen actions are excluded.
 */

function buildPerceivedInteraction(
  perceptionState:
    PerceptionState,
) {
  const parts:
    string[] = []

  if (
    perceptionState
      .heardDialogue
      .length > 0
  ) {
    parts.push(
      ...perceptionState
        .heardDialogue
        .map(
          (dialogue) =>
            `Spoken dialogue: ${dialogue}`,
        ),
    )
  }

  if (
    perceptionState
      .visibleUserActions
      .length > 0
  ) {
    parts.push(
      ...perceptionState
        .visibleUserActions
        .map(
          (action) =>
            `Visible action: ${action}`,
        ),
    )
  }

  return parts
    .join('\n')
    .trim()
}


export async function evaluateRelationshipInteraction({
  signal,
  context,
  characterName,
  userMessage,
  conversationHistory,
  perceptionState,
}: RelationshipEvaluationArgs):
Promise<RelationshipEvaluation> {
  const characterId =
    context.characterId

  const before =
    getCharacterRelationship(
      characterId,
    )

  const personality =
    getCharacterPersonality(
      characterId,
    )

  /*
   * ================================================================
   * PERCEPTION FILTER
   * ================================================================
   */

  const perceivedInteraction =
    buildPerceivedInteraction(
      perceptionState,
    )


  /*
   * ================================================================
   * SEMANTIC INTERPRETATION
   * ================================================================
   *
   * Ollama evaluates WHAT the character
   * actually perceived socially and
   * emotionally.
   */

  const assessment =
    await assessInteractionSemantically({
      signal,
      context,

      characterName,

      userMessage,

      perceivedInteraction,

      conversationHistory,
    })

  signal?.throwIfAborted()


  /*
   * ================================================================
   * PERSISTENT MEMORY
   * ================================================================
   *
   * Memory receives only the interaction
   * that survived the perception filter.
   * It reuses the existing semantic
   * assessment, so no extra Ollama call
   * is required.
   */

  rememberPerceivedInteraction({
    characterId,

    perceivedInteraction,

    assessment,
  })


  /*
   * ================================================================
   * CHEMISTRY ENGINE
   * ================================================================
   *
   * Chemistry uses the SAME semantic
   * assessment and perceived interaction
   * as the relationship system.
   *
   * No second Ollama assessment is needed.
   */

  const chemistry =
    evaluateChemistryInteraction({
      context,

      assessment,

      perceivedInteraction,
    })


  console.log(
    '[VelvetVerse Chemistry Evaluation]',
    {
      character:
        characterName,

      perceivedInteraction,

      reaction:
        chemistry.reaction,

      before:
        chemistry.before,

      changes:
        chemistry.changes,

      after:
        chemistry.after,

      reason:
        chemistry.reason,
    },
  )

  const rawChanges:
    RelationshipChanges = {}


  const reason:
    string[] = []


  const slowToTrust =
    hasTrait(
      personality.traits,
      'slow to trust',
    )

  const suspicious =
    hasTrait(
      personality.traits,
      'suspicious',
    )

  const romanticCharacter =
    hasTrait(
      personality.traits,
      'romantic',
    )

  const protective =
    hasTrait(
      personality.traits,
      'protective',
    )

  const playfulCharacter =
    hasTrait(
      personality.traits,
      'playful',
    )

  const emotionallyRestrained =
    personality.tone
      .toLowerCase()
      .includes(
        'emotionally restrained',
      )


  /*
   * ================================================================
   * HOSTILITY
   * ================================================================
   */

  if (
    assessment.hostile >=
    0.7
  ) {
    addChange(
      rawChanges,
      'trust',
      -5,
    )

    addChange(
      rawChanges,
      'affection',
      -4,
    )

    addChange(
      rawChanges,
      'respect',
      -4,
    )

    addChange(
      rawChanges,
      'comfort',
      -4,
    )

    addChange(
      rawChanges,
      'irritation',
      8,
    )

    addChange(
      rawChanges,
      'caution',
      7,
    )

    reason.push(
      'The perceived interaction was openly hostile and seriously damaged emotional safety.',
    )
  }


  /*
   * ================================================================
   * RUDENESS
   * ================================================================
   */

  if (
    assessment.rude >=
    0.5
  ) {
    addChange(
      rawChanges,
      'respect',
      -2,
    )

    addChange(
      rawChanges,
      'comfort',
      -2,
    )

    addChange(
      rawChanges,
      'irritation',
      4,
    )

    if (
      assessment.rude >=
      0.8
    ) {
      addChange(
        rawChanges,
        'trust',
        -1,
      )
    }

    reason.push(
      'The character perceived disrespectful or abrasive behaviour.',
    )
  }


  /*
   * ================================================================
   * PRESSURE / BOUNDARY PUSHING
   * ================================================================
   */

  if (
    assessment.pressuring >=
    0.5
  ) {
    addChange(
      rawChanges,
      'trust',
      -3,
    )

    addChange(
      rawChanges,
      'respect',
      -3,
    )

    addChange(
      rawChanges,
      'comfort',
      -3,
    )

    addChange(
      rawChanges,
      'irritation',
      3,
    )

    addChange(
      rawChanges,
      'caution',
      5,
    )

    reason.push(
      'The character perceived emotional or social pressure that reduced their sense of autonomy.',
    )
  }


  /*
   * ================================================================
   * DISHONESTY
   * ================================================================
   */

  if (
    assessment.dishonest >=
    0.5
  ) {
    addChange(
      rawChanges,
      'trust',
      -5,
    )

    addChange(
      rawChanges,
      'respect',
      -2,
    )

    addChange(
      rawChanges,
      'comfort',
      -1,
    )

    addChange(
      rawChanges,
      'caution',
      5,
    )

    reason.push(
      'Perceived dishonesty damaged trust.',
    )
  }


  /*
   * ================================================================
   * RESPECT
   * ================================================================
   */

  if (
    assessment.respectful >=
    0.5
  ) {
    addChange(
      rawChanges,
      'respect',
      assessment.respectful >=
        0.85
        ? 2
        : 1,
    )

    addChange(
      rawChanges,
      'comfort',
      0.5,
    )

    if (
      !slowToTrust &&
      assessment.respectful >=
        0.7
    ) {
      addChange(
        rawChanges,
        'trust',
        0.5,
      )
    }

    if (
      slowToTrust &&
      assessment.respectful >=
        0.9
    ) {
      addChange(
        rawChanges,
        'trust',
        0.5,
      )
    }

    if (
      assessment.pressuring <
      0.2
    ) {
      addChange(
        rawChanges,
        'caution',
        -0.5,
      )
    }

    reason.push(
      'The character perceived meaningful respect or consideration.',
    )
  }


  /*
   * ================================================================
   * SUPPORT
   * ================================================================
   */

  if (
    assessment.supportive >=
    0.55
  ) {
    addChange(
      rawChanges,
      'comfort',
      1.5,
    )

    addChange(
      rawChanges,
      'affection',
      0.75,
    )

    if (
      assessment.supportive >=
      0.8
    ) {
      addChange(
        rawChanges,
        'trust',
        slowToTrust
          ? 0.5
          : 1,
      )
    }

    if (
      assessment.pressuring <
      0.2
    ) {
      addChange(
        rawChanges,
        'caution',
        -0.5,
      )
    }

    reason.push(
      'The perceived interaction created emotional support and safety.',
    )
  }


  /*
   * ================================================================
   * VULNERABILITY
   * ================================================================
   */

  if (
    assessment.vulnerable >=
    0.6
  ) {
    if (
      before.comfort >= 10 ||
      before.trust >= 12
    ) {
      addChange(
        rawChanges,
        'trust',
        1.5,
      )

      addChange(
        rawChanges,
        'affection',
        1.25,
      )

      addChange(
        rawChanges,
        'comfort',
        0.75,
      )

      reason.push(
        'The character perceived genuine vulnerability within an increasingly safe relationship.',
      )
    } else {
      addChange(
        rawChanges,
        'trust',
        0.5,
      )

      addChange(
        rawChanges,
        'affection',
        0.5,
      )

      reason.push(
        'The character noticed genuine vulnerability, although the relationship is still new.',
      )
    }
  }


  /*
   * ================================================================
   * LOYALTY
   * ================================================================
   */

  if (
    assessment.loyal >=
    0.6
  ) {
    addChange(
      rawChanges,
      'trust',
      1.5,
    )

    addChange(
      rawChanges,
      'respect',
      1.5,
    )

    addChange(
      rawChanges,
      'comfort',
      0.5,
    )

    if (
      protective
    ) {
      addChange(
        rawChanges,
        'affection',
        0.75,
      )
    }

    reason.push(
      protective
        ? 'The perceived loyalty strongly resonated with the character’s protective values.'
        : 'The character perceived reliability or loyalty.',
    )
  }


  /*
   * ================================================================
   * PLAYFULNESS
   * ================================================================
   */

  if (
    assessment.playful >=
      0.5 &&
    assessment.hostile <
      0.3 &&
    assessment.rude <
      0.4
  ) {
    addChange(
      rawChanges,
      'comfort',
      playfulCharacter
        ? 0.75
        : 0.4,
    )

    if (
      playfulCharacter &&
      before.comfort >= 10
    ) {
      addChange(
        rawChanges,
        'affection',
        0.4,
      )
    }

    reason.push(
      'The perceived playful interaction slightly reduced social distance.',
    )
  }


  /*
   * ================================================================
   * SOCIAL INVITATION
   * ================================================================
   */

  if (
    assessment.socialInvitation >=
    0.55
  ) {
    addChange(
      rawChanges,
      'comfort',
      0.6,
    )

    if (
      before.comfort >= 15
    ) {
      addChange(
        rawChanges,
        'affection',
        0.4,
      )
    }

    if (
      before.attraction >= 15 &&
      assessment.flirtatious >=
        0.4
    ) {
      addChange(
        rawChanges,
        'attraction',
        0.5,
      )
    }

    reason.push(
      'The perceived invitation created an opportunity for greater familiarity without automatically creating intimacy.',
    )
  }


  /*
   * ================================================================
   * FLIRTATION
   * ================================================================
   */

  if (
    assessment.flirtatious >=
    0.5
  ) {
    addChange(
      rawChanges,
      'attraction',
      assessment.flirtatious >=
        0.85
        ? 1.5
        : 0.75,
    )

    if (
      before.trust >= 20 &&
      before.comfort >= 15
    ) {
      addChange(
        rawChanges,
        'affection',
        0.5,
      )

      addChange(
        rawChanges,
        'comfort',
        0.4,
      )

      reason.push(
        'The flirtation was perceived and welcomed within an already developing bond.',
      )
    } else if (
      slowToTrust ||
      suspicious
    ) {
      addChange(
        rawChanges,
        'caution',
        0.5,
      )

      reason.push(
        'The character perceived the flirtation but remained cautious because trust is still developing.',
      )
    } else {
      reason.push(
        'The character perceived the flirtation without treating it as emotional intimacy.',
      )
    }
  }


  /*
   * ================================================================
   * ROMANTIC INTEREST
   * ================================================================
   */

  if (
    assessment.romantic >=
    0.55
  ) {
    addChange(
      rawChanges,
      'attraction',
      romanticCharacter
        ? 1.25
        : 0.75,
    )

    if (
      before.trust >= 25 &&
      before.comfort >= 20 &&
      before.affection >= 15
    ) {
      addChange(
        rawChanges,
        'affection',
        1,
      )

      addChange(
        rawChanges,
        'comfort',
        0.5,
      )

      if (
        assessment.respectful >=
        0.6
      ) {
        addChange(
          rawChanges,
          'trust',
          0.5,
        )
      }

      reason.push(
        'Perceived romantic interest arrived within an established emotional foundation and deepened existing feelings.',
      )
    } else {
      addChange(
        rawChanges,
        'affection',
        0.25,
      )

      if (
        slowToTrust ||
        suspicious
      ) {
        addChange(
          rawChanges,
          'caution',
          0.75,
        )
      }

      reason.push(
        'The romantic interest was perceived, but the relationship has not yet earned deep intimacy.',
      )
    }

    if (
      emotionallyRestrained &&
      before.affection < 20
    ) {
      const currentAffection =
        rawChanges.affection ?? 0

      if (
        currentAffection >
        0.5
      ) {
        rawChanges.affection =
          0.5
      }
    }
  }


  /*
   * ================================================================
   * MIXED SIGNALS
   * ================================================================
   */

  if (
    assessment.flirtatious >=
      0.5 &&
    assessment.pressuring >=
      0.5
  ) {
    addChange(
      rawChanges,
      'caution',
      2,
    )

    addChange(
      rawChanges,
      'comfort',
      -1,
    )

    reason.push(
      'The perceived interaction contained attraction but also pressure, creating mixed feelings.',
    )
  }

  if (
    assessment.romantic >=
      0.6 &&
    assessment.respectful >=
      0.8
  ) {
    addChange(
      rawChanges,
      'respect',
      0.5,
    )

    reason.push(
      'The perceived romantic interest was expressed with meaningful respect.',
    )
  }


  /*
   * ================================================================
   * PROGRESSION GOVERNOR
   * ================================================================
   */

  const repetitionFactor =
    perceivedInteraction
      ? getRecentRepetitionFactor(
          perceivedInteraction,
          conversationHistory,
        )
      : 1


  const changes =
    governPositiveProgression(
      rawChanges,
      assessment,
      context,
      repetitionFactor,
    )


  if (
    repetitionFactor <
    1
  ) {
    reason.push(
      'Very similar recent perceived interaction received sharply diminished positive returns.',
    )
  }


  /*
   * ================================================================
   * NO MEANINGFUL CHANGE
   * ================================================================
   */

  if (
    Object.keys(
      changes,
    ).length === 0
  ) {
    if (
      !perceivedInteraction
    ) {
      reason.push(
        'The character perceived no relationship-relevant interaction.',
      )
    } else {
      reason.push(
        'The perceived interaction did not meaningfully alter the relationship.',
      )
    }
  }


  /*
   * ================================================================
   * SAVE
   * ================================================================
   */

  const after =
    applyRelationshipChanges(
      characterId,
      changes,
    )


  console.log(
    '[VelvetVerse Relationship]',
    {
      character:
        characterName,

      originalMessage:
        userMessage,

      perceivedInteraction,

      assessment,

      chemistry,

      rawChanges,

      repetitionFactor,

      governedChanges:
        changes,

      before,

      after,

      reason,
    },
  )


  return {
    before,

    assessment,

    chemistry,

    changes,

    after,

    reason,
  }
}
