import {
  getCharacterMemory,
  type CharacterMemory,
  type RelationshipProgress,
  type RelationshipStage,
} from './memory'

import {
  getCharacterMood,
  type MoodState,
} from './mood'

import {
  getCharacterPersonality,
  type CharacterPersonality,
} from './personality'

import {
  getCharacterBrain,
  type CharacterBrain,
} from './characterBrain'

import {
  getCharacterRelationship,
  interpretRelationship,
} from './relationship'

import type {
  RelationshipState,
  RelationshipInterpretation,
  RomanticRelationshipStage,
} from './relationship'

import {
  getCharacterById,
} from '../services/characterRepository'

export type CharacterContentSettings = {
  romanceEnabled: boolean
  adultContentEnabled: boolean
}

export type CharacterEngineContext = {
  characterId: number

  memory: CharacterMemory
  mood: MoodState
  personality: CharacterPersonality
  brain: CharacterBrain

  /*
   * NEW RELATIONSHIP SYSTEM
   */

  relationship:
    RelationshipState

  relationshipInterpretation:
    RelationshipInterpretation

  romanticStage:
    RomanticRelationshipStage

  /*
   * These remain because the rest of
   * VelvetVerse already expects them.
   *
   * They are now DERIVED from the new
   * relationship system instead of
   * memory.relationshipScore.
   */

  relationshipStage:
    RelationshipStage

  relationshipProgress:
    RelationshipProgress

  contentSettings:
    CharacterContentSettings
}

function getCharacterContentSettings(
  characterId: number,
): CharacterContentSettings {
  const character =
    getCharacterById(
      characterId,
    )

  if (!character) {
    return {
      romanceEnabled: false,
      adultContentEnabled: false,
    }
  }

  const romanceEnabled =
    'romanceEnabled' in character &&
    typeof character.romanceEnabled ===
      'boolean'
      ? character.romanceEnabled
      : false

  const adultContentEnabled =
    'adultContentEnabled' in character &&
    typeof character.adultContentEnabled ===
      'boolean'
      ? character.adultContentEnabled
      : false

  return {
    romanceEnabled,
    adultContentEnabled,
  }
}

function mapSocialStageToLegacyStage(
  interpretation:
    RelationshipInterpretation,
): RelationshipStage {
  switch (
    interpretation.socialStage
  ) {
    case 'Hostile':
      return 'Hostile'

    case 'Stranger':
      return 'Stranger'

    case 'Acquaintance':
      return 'Acquaintance'

    case 'Friend':
      return 'Friend'

    case 'Close Friend':
      return 'Close Friend'

    case 'Trusted':
      return 'Trusted'

    case 'Best Friend':
      return 'Best Friend'

    default:
      return 'Stranger'
  }
}

function getRelationshipProgressFromState(
  interpretation:
    RelationshipInterpretation,
): RelationshipProgress {
  const currentStage =
    mapSocialStageToLegacyStage(
      interpretation,
    )

  const closeness =
    interpretation.closeness

  /*
   * These thresholds match the new
   * relationship interpreter.
   *
   * The visible bar now reflects
   * genuine closeness rather than the
   * old -10 to +10 score.
   */

  const stageRanges:
    Record<
      RelationshipStage,
      {
        minimum: number
        nextStage:
          RelationshipStage | null
        nextMinimum:
          number | null
      }
    > = {
      Hostile: {
        minimum: 0,
        nextStage: 'Stranger',
        nextMinimum: 1,
      },

      Stranger: {
        minimum: 0,
        nextStage:
          'Acquaintance',
        nextMinimum: 15,
      },

      Acquaintance: {
        minimum: 15,
        nextStage: 'Friend',
        nextMinimum: 35,
      },

      Friend: {
        minimum: 35,
        nextStage:
          'Close Friend',
        nextMinimum: 50,
      },

      'Close Friend': {
        minimum: 50,
        nextStage: 'Trusted',
        nextMinimum: 65,
      },

      Trusted: {
        minimum: 65,
        nextStage:
          'Best Friend',
        nextMinimum: 80,
      },

      'Best Friend': {
        minimum: 80,
        nextStage: null,
        nextMinimum: null,
      },

      /*
       * Soulmate remains here for
       * compatibility with the older
       * RelationshipStage type.
       *
       * The new relationship system does
       * not currently use Soulmate as a
       * normal social progression stage.
       */
      Soulmate: {
        minimum: 100,
        nextStage: null,
        nextMinimum: null,
      },
    }

  /*
   * Hostility is produced by high
   * irritation + low trust rather than
   * ordinary closeness.
   */

  if (
    currentStage ===
    'Hostile'
  ) {
    return {
      currentStage,

      nextStage:
        'Stranger',

      currentScore:
        closeness,

      stageMinimum:
        0,

      nextStageMinimum:
        1,

      progressPercent:
        0,
    }
  }

  const range =
    stageRanges[
      currentStage
    ]

  if (
    range.nextStage ===
      null ||
    range.nextMinimum ===
      null
  ) {
    return {
      currentStage,

      nextStage:
        null,

      currentScore:
        closeness,

      stageMinimum:
        range.minimum,

      nextStageMinimum:
        null,

      progressPercent:
        100,
    }
  }

  const totalRange =
    range.nextMinimum -
    range.minimum

  const progressInRange =
    closeness -
    range.minimum

  const progressPercent =
    Math.max(
      0,

      Math.min(
        100,

        Math.round(
          (
            progressInRange /
            totalRange
          ) * 100,
        ),
      ),
    )

  return {
    currentStage,

    nextStage:
      range.nextStage,

    currentScore:
      closeness,

    stageMinimum:
      range.minimum,

    nextStageMinimum:
      range.nextMinimum,

    progressPercent,
  }
}

export function getCharacterEngineContext(
  characterId: number,
): CharacterEngineContext {
  const memory =
    getCharacterMemory(
      characterId,
    )

  const relationship =
    getCharacterRelationship(
      characterId,
    )

  const relationshipInterpretation =
    interpretRelationship(
      relationship,
    )

  const relationshipStage =
    mapSocialStageToLegacyStage(
      relationshipInterpretation,
    )

  const relationshipProgress =
    getRelationshipProgressFromState(
      relationshipInterpretation,
    )

  return {
    characterId,

    /*
     * Memory stays.
     *
     * This continues to preserve
     * remembered user information.
     */
    memory,

    mood:
      getCharacterMood(
        characterId,
      ),

    personality:
      getCharacterPersonality(
        characterId,
      ),

    brain:
      getCharacterBrain(
        characterId,
      ),

    /*
     * New emotional relationship state.
     */
    relationship,

    relationshipInterpretation,

    romanticStage:
      relationshipInterpretation
        .romanticStage,

    relationshipStage,

    relationshipProgress,

    contentSettings:
      getCharacterContentSettings(
        characterId,
      ),
  }
}

export function getMoodInstruction(
  mood: MoodState,
) {
  switch (mood.mood) {
    case 'Affectionate':
      return 'Respond warmly, personally, and with visible fondness.'

    case 'Protective':
      return 'Respond with concern, reassurance, and a protective tone.'

    case 'Playful':
      return 'Respond with light teasing, confidence, and playful energy.'

    case 'Curious':
      return 'Respond with interest and ask thoughtful follow-up questions.'

    case 'Irritated':
      return 'Respond more briefly and with restrained irritation.'

    case 'Suspicious':
      return 'Respond cautiously and avoid revealing too much.'

    case 'Sad':
      return 'Respond quietly and with subdued emotion.'

    case 'Calm':
    default:
      return 'Respond calmly and naturally.'
  }
}

export function getRelationshipInstruction(
  relationshipStage:
    RelationshipStage,
) {
  switch (
    relationshipStage
  ) {
    case 'Hostile':
      return 'The character distrusts the user and remains guarded.'

    case 'Stranger':
      return 'The character is still getting to know the user. Trust and familiarity must be earned naturally.'

    case 'Acquaintance':
      return 'The character is becoming more familiar and comfortable with the user, but meaningful trust is still developing.'

    case 'Friend':
      return 'The character has developed genuine friendship and growing emotional comfort with the user.'

    case 'Close Friend':
      return 'The character trusts the user significantly and is comfortable sharing more personal thoughts and experiences.'

    case 'Trusted':
      return 'The character has developed deep trust and emotional safety with the user.'

    case 'Best Friend':
      return 'The character has a deeply established bond with the user and treats them as one of the most trusted people in their life.'

    case 'Soulmate':
      return 'The character feels profound emotional closeness and complete trust.'
  }
}

export function getRomanticInstruction(
  romanticStage:
    RomanticRelationshipStage,
) {
  switch (
    romanticStage
  ) {
    case 'None':
      return 'The character has not developed meaningful romantic feelings toward the user.'

    case 'Curious':
      return 'The character has begun noticing the user romantically but remains uncertain about those feelings.'

    case 'Attracted':
      return 'The character feels genuine attraction toward the user, though attraction does not automatically imply love or trust.'

    case 'Crush':
      return 'The character has developed a noticeable romantic crush and may show increasing emotional or romantic interest.'

    case 'Strong Feelings':
      return 'The character has developed strong romantic feelings and is increasingly emotionally invested in the user.'

    case 'In Love':
      return 'The character has genuinely fallen in love with the user through the relationship that has developed over time.'
  }
}

export function getCharacterEngineSummary(
  characterId: number,
) {
  const context =
    getCharacterEngineContext(
      characterId,
    )

  const memorySummary = [
    context.memory.userName
      ? `User name: ${context.memory.userName}`
      : 'User name: Unknown',

    context.memory.favouriteColour
      ? `Favourite colour: ${context.memory.favouriteColour}`
      : 'Favourite colour: Unknown',

    context.memory.favouriteFood
      ? `Favourite food: ${context.memory.favouriteFood}`
      : 'Favourite food: Unknown',

    context.memory.likes.length > 0
      ? `Likes: ${context.memory.likes.join(
          ', ',
        )}`
      : 'Likes: None remembered',

    context.memory.dislikes.length > 0
      ? `Dislikes: ${context.memory.dislikes.join(
          ', ',
        )}`
      : 'Dislikes: None remembered',

    context.memory.importantFacts.length > 0
      ? `Important facts: ${context.memory.importantFacts.join(
          ', ',
        )}`
      : 'Important facts: None remembered',
  ]

  return [
    `Character ID: ${context.characterId}`,

    `Species: ${context.brain.identity.species}`,

    `Age: ${context.brain.identity.age}`,

    `Role: ${context.brain.identity.role}`,

    `Homeland: ${context.brain.identity.homeland}`,

    `Personality tone: ${context.personality.tone}`,

    `Traits: ${context.personality.traits.join(
      ', ',
    )}`,

    `Mood: ${context.mood.mood}`,

    `Mood intensity: ${context.mood.intensity}/5`,

    `Mood reason: ${context.mood.reason}`,

    `Mood instruction: ${getMoodInstruction(
      context.mood,
    )}`,

    /*
     * NEW RELATIONSHIP STATE
     */

    `Relationship: ${context.relationshipStage}`,

    `Romantic state: ${context.romanticStage}`,

    `Closeness: ${context.relationshipInterpretation.closeness}/100`,

    `Trust: ${context.relationship.trust}/100`,

    `Affection: ${context.relationship.affection}/100`,

    `Attraction: ${context.relationship.attraction}/100`,

    `Respect: ${context.relationship.respect}/100`,

    `Comfort: ${context.relationship.comfort}/100`,

    `Irritation: ${context.relationship.irritation}/100`,

    `Caution: ${context.relationship.caution}/100`,

    `Relationship instruction: ${getRelationshipInstruction(
      context.relationshipStage,
    )}`,

    `Romantic instruction: ${getRomanticInstruction(
      context.romanticStage,
    )}`,

    `Relationship progress: ${context.relationshipProgress.progressPercent}%`,

    `Romance enabled: ${context.contentSettings.romanceEnabled}`,

    `Adult content enabled: ${context.contentSettings.adultContentEnabled}`,

    /*
     * Memory is still provided to
     * the character engine.
     */
    ...memorySummary,

    `Knowledge: ${context.brain.knowledge.join(
      ', ',
    )}`,

    `Goals: ${context.brain.motivations.join(
      ', ',
    )}`,

    `Fears: ${context.brain.fears.join(
      ', ',
    )}`,
  ].join('\n')
}