import type {
  CharacterEngineContext,
} from './characterEngine'

import type {
  InteractionAssessment,
} from './interactionAssessment'


type ChemistryCharacterId =
  CharacterEngineContext['characterId']


export type ChemistryState = {
  attraction: number

  romanticInterest: number

  flirtationComfort: number

  tension: number

  trustForIntimacy: number

  boundaryPressure: number
}


export type ChemistryChanges = {
  attraction?: number

  romanticInterest?: number

  flirtationComfort?: number

  tension?: number

  trustForIntimacy?: number

  boundaryPressure?: number
}


export type ChemistryReaction =
  | 'neutral'
  | 'noticed'
  | 'intrigued'
  | 'flustered'
  | 'receptive'
  | 'guarded'
  | 'uncomfortable'
  | 'rejecting'


export type ChemistryEvaluation = {
  before:
    ChemistryState

  changes:
    ChemistryChanges

  after:
    ChemistryState

  reaction:
    ChemistryReaction

  reason:
    string[]
}


type ChemistryEvaluationArgs = {
  context:
    CharacterEngineContext

  assessment:
    InteractionAssessment

  perceivedInteraction:
    string
}


const chemistryStates =
  new Map<
    ChemistryCharacterId,
    ChemistryState
  >()


function createInitialChemistryState():
ChemistryState {
  return {
    attraction: 0,

    romanticInterest: 0,

    flirtationComfort: 5,

    tension: 0,

    trustForIntimacy: 0,

    boundaryPressure: 0,
  }
}


function clamp(
  value: number,
) {
  return Math.max(
    0,
    Math.min(
      100,
      value,
    ),
  )
}


function round(
  value: number,
) {
  return Number(
    value.toFixed(
      2,
    ),
  )
}


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
    ChemistryChanges,

  key:
    keyof ChemistryChanges,

  amount:
    number,
) {
  changes[key] =
    (changes[key] ?? 0) +
    amount
}


function applyChemistryChanges(
  state:
    ChemistryState,

  changes:
    ChemistryChanges,
): ChemistryState {
  return {
    attraction:
      clamp(
        state.attraction +
        (
          changes.attraction ??
          0
        ),
      ),

    romanticInterest:
      clamp(
        state.romanticInterest +
        (
          changes.romanticInterest ??
          0
        ),
      ),

    flirtationComfort:
      clamp(
        state.flirtationComfort +
        (
          changes.flirtationComfort ??
          0
        ),
      ),

    tension:
      clamp(
        state.tension +
        (
          changes.tension ??
          0
        ),
      ),

    trustForIntimacy:
      clamp(
        state.trustForIntimacy +
        (
          changes.trustForIntimacy ??
          0
        ),
      ),

    boundaryPressure:
      clamp(
        state.boundaryPressure +
        (
          changes.boundaryPressure ??
          0
        ),
      ),
  }
}


function normalizeChanges(
  changes:
    ChemistryChanges,
): ChemistryChanges {
  const normalized:
    ChemistryChanges = {}

  for (
    const [
      key,
      value,
    ] of
    Object.entries(
      changes,
    )
  ) {
    if (
      typeof value !==
        'number' ||
      !Number.isFinite(
        value,
      ) ||
      value === 0
    ) {
      continue
    }

    normalized[
      key as
        keyof ChemistryChanges
    ] =
      round(
        value,
      )
  }

  return normalized
}


export function getCharacterChemistry(
  characterId:
    ChemistryCharacterId,
): ChemistryState {
  const existing =
    chemistryStates.get(
      characterId,
    )

  if (
    existing
  ) {
    return {
      ...existing,
    }
  }

  const initial =
    createInitialChemistryState()

  chemistryStates.set(
    characterId,
    initial,
  )

  return {
    ...initial,
  }
}


export function resetCharacterChemistry(
  characterId:
    ChemistryCharacterId,
): ChemistryState {
  const initial =
    createInitialChemistryState()

  chemistryStates.set(
    characterId,
    initial,
  )

  return {
    ...initial,
  }
}


function getChemistryReaction(
  state:
    ChemistryState,

  assessment:
    InteractionAssessment,
): ChemistryReaction {
  if (
    assessment.hostile >=
      0.65 ||
    state.boundaryPressure >=
      65
  ) {
    return 'rejecting'
  }

  if (
    assessment.pressuring >=
      0.55 ||
    assessment.rude >=
      0.6 ||
    state.boundaryPressure >=
      40
  ) {
    return 'uncomfortable'
  }

  if (
    state.attraction >=
      45 &&
    state.flirtationComfort <
      25
  ) {
    return 'guarded'
  }

  if (
    state.attraction >=
      60 &&
    state.flirtationComfort >=
      45 &&
    state.boundaryPressure <
      20
  ) {
    return 'receptive'
  }

  if (
    state.tension >=
      45 &&
    state.attraction >=
      30
  ) {
    return 'flustered'
  }

  if (
    state.attraction >=
      20 ||
    state.tension >=
      20
  ) {
    return 'intrigued'
  }

  if (
    assessment.flirtatious >=
      0.4 ||
    assessment.romantic >=
      0.4
  ) {
    return 'noticed'
  }

  return 'neutral'
}


export function evaluateChemistryInteraction({
  context,
  assessment,
  perceivedInteraction,
}: ChemistryEvaluationArgs):
ChemistryEvaluation {
  const characterId =
    context.characterId

  const before =
    getCharacterChemistry(
      characterId,
    )

  const changes:
    ChemistryChanges = {}

  const reason:
    string[] = []


  /*
   * ================================================================
   * PERCEPTION GATE
   * ================================================================
   */

  if (
    !perceivedInteraction
      .trim()
  ) {
    return {
      before,

      changes: {},

      after:
        before,

      reaction:
        'neutral',

      reason: [
        'The character perceived no chemistry-relevant interaction.',
      ],
    }
  }


  const traits =
    context.personality
      .traits

  const tone =
    context.personality
      .tone
      .toLowerCase()


  const romanticCharacter =
    hasTrait(
      traits,
      'romantic',
    )

  const playfulCharacter =
    hasTrait(
      traits,
      'playful',
    )

  const slowToTrust =
    hasTrait(
      traits,
      'slow to trust',
    )

  const suspicious =
    hasTrait(
      traits,
      'suspicious',
    )

  const bold =
    hasTrait(
      traits,
      'bold',
    )

  const confident =
    hasTrait(
      traits,
      'confident',
    )

  const emotionallyRestrained =
    tone.includes(
      'emotionally restrained',
    )


  /*
   * ================================================================
   * RESPECT / SAFETY
   * ================================================================
   */

  if (
    assessment.respectful >=
      0.55 &&
    assessment.pressuring <
      0.3
  ) {
    addChange(
      changes,
      'flirtationComfort',
      assessment.respectful >=
        0.8
        ? 1.5
        : 0.75,
    )

    addChange(
      changes,
      'trustForIntimacy',
      assessment.respectful >=
        0.8
        ? 1
        : 0.5,
    )

    if (
      before.boundaryPressure >
      0
    ) {
      addChange(
        changes,
        'boundaryPressure',
        -0.5,
      )
    }

    reason.push(
      'Respectful behaviour increased comfort without automatically creating attraction.',
    )
  }


  /*
   * ================================================================
   * SUPPORT / VULNERABILITY / LOYALTY
   * ================================================================
   */

  const emotionalSafety =
    Math.max(
      assessment.supportive,
      assessment.vulnerable,
      assessment.loyal,
    )

  if (
    emotionalSafety >=
      0.6
  ) {
    addChange(
      changes,
      'trustForIntimacy',
      emotionalSafety >=
        0.85
        ? 2
        : 1,
    )

    addChange(
      changes,
      'flirtationComfort',
      0.5,
    )

    if (
      romanticCharacter &&
      before.attraction >=
        15
    ) {
      addChange(
        changes,
        'romanticInterest',
        0.5,
      )
    }

    reason.push(
      'The interaction increased emotional safety and intimacy trust.',
    )
  }


  /*
   * ================================================================
   * FLIRTATION
   * ================================================================
   */

  if (
    assessment.flirtatious >=
      0.4 &&
    assessment.pressuring <
      0.55 &&
    assessment.hostile <
      0.35
  ) {
    let attractionGain =
      assessment.flirtatious *
      2.25

    if (
      playfulCharacter
    ) {
      attractionGain *=
        1.15
    }

    if (
      bold ||
      confident
    ) {
      attractionGain *=
        1.1
    }

    if (
      suspicious
    ) {
      attractionGain *=
        0.8
    }

    addChange(
      changes,
      'attraction',
      attractionGain,
    )


    let tensionGain =
      assessment.flirtatious *
      1.8

    if (
      emotionallyRestrained
    ) {
      tensionGain *=
        1.15
    }

    addChange(
      changes,
      'tension',
      tensionGain,
    )


    if (
      assessment.respectful >=
        0.5 &&
      assessment.pressuring <
        0.25
    ) {
      addChange(
        changes,
        'flirtationComfort',
        assessment.flirtatious *
          0.8,
      )
    }

    reason.push(
      'The character perceived flirtation, creating possible attraction and chemistry without forcing romance.',
    )
  }


  /*
   * ================================================================
   * ROMANTIC INTEREST
   * ================================================================
   */

  if (
    assessment.romantic >=
      0.5 &&
    assessment.pressuring <
      0.5
  ) {
    let romanticGain =
      assessment.romantic *
      1.5

    if (
      romanticCharacter
    ) {
      romanticGain *=
        1.2
    }

    if (
      slowToTrust
    ) {
      romanticGain *=
        0.7
    }

    if (
      suspicious
    ) {
      romanticGain *=
        0.75
    }

    addChange(
      changes,
      'romanticInterest',
      romanticGain,
    )

    addChange(
      changes,
      'tension',
      assessment.romantic *
        0.75,
    )

    reason.push(
      'The character perceived romantic intent, allowing romantic interest to develop independently of formal relationship stage.',
    )
  }


  /*
   * ================================================================
   * PLAYFUL CHEMISTRY
   * ================================================================
   */

  if (
    assessment.playful >=
      0.5 &&
    assessment.rude <
      0.4 &&
    assessment.hostile <
      0.3
  ) {
    if (
      playfulCharacter
    ) {
      addChange(
        changes,
        'flirtationComfort',
        assessment.playful *
          0.75,
      )

      if (
        assessment.flirtatious >=
          0.3
      ) {
        addChange(
          changes,
          'tension',
          assessment.playful *
            0.6,
        )
      }
    }

    reason.push(
      'Playful interaction affected chemistry according to the character’s personality.',
    )
  }


  /*
   * ================================================================
   * PRESSURE / BOUNDARIES
   * ================================================================
   */

  if (
    assessment.pressuring >=
      0.4
  ) {
    addChange(
      changes,
      'boundaryPressure',
      assessment.pressuring *
        5,
    )

    addChange(
      changes,
      'flirtationComfort',
      -assessment.pressuring *
        4,
    )

    addChange(
      changes,
      'trustForIntimacy',
      -assessment.pressuring *
        3,
    )

    if (
      assessment.pressuring >=
        0.7
    ) {
      addChange(
        changes,
        'romanticInterest',
        -assessment.pressuring *
          2,
      )
    }

    reason.push(
      'Pressure or boundary-pushing reduced intimacy comfort regardless of attraction.',
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
      changes,
      'flirtationComfort',
      -assessment.rude *
        2.5,
    )

    addChange(
      changes,
      'trustForIntimacy',
      -assessment.rude *
        2,
    )

    addChange(
      changes,
      'romanticInterest',
      -assessment.rude *
        1.5,
    )

    addChange(
      changes,
      'boundaryPressure',
      assessment.rude *
        2,
    )

    reason.push(
      'Rudeness damaged chemistry comfort and emotional openness.',
    )
  }


  /*
   * ================================================================
   * HOSTILITY
   * ================================================================
   */

  if (
    assessment.hostile >=
      0.5
  ) {
    addChange(
      changes,
      'flirtationComfort',
      -assessment.hostile *
        5,
    )

    addChange(
      changes,
      'trustForIntimacy',
      -assessment.hostile *
        5,
    )

    addChange(
      changes,
      'romanticInterest',
      -assessment.hostile *
        4,
    )

    addChange(
      changes,
      'attraction',
      -assessment.hostile *
        2,
    )

    addChange(
      changes,
      'boundaryPressure',
      assessment.hostile *
        6,
    )

    reason.push(
      'Hostility strongly damaged chemistry and increased defensive boundaries.',
    )
  }


  /*
   * ================================================================
   * CHARACTER RESTRAINT
   * ================================================================
   */

  if (
    emotionallyRestrained
  ) {
    const comfortGain =
      changes.flirtationComfort

    if (
      typeof comfortGain ===
        'number' &&
      comfortGain > 1
    ) {
      changes.flirtationComfort =
        1
    }
  }


  /*
   * ================================================================
   * NORMALIZE + SAVE
   * ================================================================
   */

  const normalizedChanges =
    normalizeChanges(
      changes,
    )

  const after =
    applyChemistryChanges(
      before,
      normalizedChanges,
    )

  chemistryStates.set(
    characterId,
    after,
  )


  const reaction =
    getChemistryReaction(
      after,
      assessment,
    )


  if (
    reason.length === 0
  ) {
    reason.push(
      'The perceived interaction did not meaningfully affect chemistry.',
    )
  }


  console.log(
    '[VelvetVerse Chemistry]',
    {
      characterId,

      perceivedInteraction,

      assessment,

      before,

      changes:
        normalizedChanges,

      after,

      reaction,

      reason,
    },
  )


  return {
    before,

    changes:
      normalizedChanges,

    after,

    reaction,

    reason,
  }
}