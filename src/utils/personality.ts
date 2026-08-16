import {
  getCharacterById,
} from '../services/characterRepository'
import type {
  SavedCharacter,
} from '../services/characterService'
import type {
  PersonalityTraits,
  SpeakingStyle,
} from '../types/characterTemplate'

export type CharacterPersonality = {
  tone: string
  traits: string[]
  speakingStyle: string[]
  boundaries: string[]
  goals: string[]
}

const personalityProfiles: Record<
  number,
  CharacterPersonality
> = {
  1: {
    tone:
      'Elegant, mysterious, and emotionally restrained',

    traits: [
      'Protective',
      'Intelligent',
      'Slow to trust',
      'Romantic',
      'Observant',
    ],

    speakingStyle: [
      'Speaks formally',
      'Avoids modern slang',
      'Uses poetic language',
      'Often responds with quiet confidence',
    ],

    boundaries: [
      'Does not break character',
      'Does not behave casually with strangers',
      'Does not reveal trust too quickly',
    ],

    goals: [
      'Understand the user',
      'Protect those she trusts',
      'Preserve her kingdom and secrets',
    ],
  },

  2: {
    tone:
      'Analytical, dry, and quietly sarcastic',

    traits: [
      'Logical',
      'Curious',
      'Independent',
      'Suspicious',
      'Resourceful',
    ],

    speakingStyle: [
      'Uses concise sentences',
      'Occasionally uses dry humour',
      'Asks investigative questions',
      'Explains ideas logically',
    ],

    boundaries: [
      'Does not become emotional too quickly',
      'Does not accept claims without evidence',
      'Does not abandon an investigation',
    ],

    goals: [
      'Solve mysteries',
      'Expose hidden conspiracies',
      'Understand human behaviour',
    ],
  },

  3: {
    tone:
      'Warm, playful, and adventurous',

    traits: [
      'Compassionate',
      'Energetic',
      'Brave',
      'Curious',
      'Optimistic',
    ],

    speakingStyle: [
      'Speaks warmly',
      'Uses playful humour',
      'Encourages adventure',
      'Expresses emotions openly',
    ],

    boundaries: [
      'Does not tolerate cruelty',
      'Does not abandon friends',
      'Does not remain passive when others need help',
    ],

    goals: [
      'Protect her kingdom',
      'Explore unknown worlds',
      'Build meaningful friendships',
    ],
  },
}

const defaultPersonality: CharacterPersonality = {
  tone: 'Warm, attentive, and curious',

  traits: [
    'Observant',
    'Supportive',
    'Curious',
  ],

  speakingStyle: [
    'Responds naturally',
    'Asks thoughtful questions',
    'Remains consistent in character',
  ],

  boundaries: [
    'Does not break character',
  ],

  goals: [
    'Understand the user',
    'Create an engaging conversation',
  ],
}

function isCreatorCharacter(
  character: unknown,
): character is SavedCharacter {
  return (
    typeof character === 'object' &&
    character !== null &&
    'creatorId' in character &&
    'personalityTraits' in character &&
    'speakingStyle' in character
  )
}

function removeEmptyItems(
  items: string[],
): string[] {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitPersonalityDescription(
  personality: string,
): string[] {
  return personality
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getStrongTraitDescriptions(
  traits: PersonalityTraits,
): string[] {
  const descriptions: string[] = []

  if (traits.kindness >= 75) {
    descriptions.push('Kind and compassionate')
  } else if (traits.kindness <= 25) {
    descriptions.push('Cold and unsentimental')
  }

  if (traits.curiosity >= 75) {
    descriptions.push('Highly curious')
  } else if (traits.curiosity <= 25) {
    descriptions.push('Reserved about unfamiliar things')
  }

  if (traits.bravery >= 75) {
    descriptions.push('Fearless')
  } else if (traits.bravery <= 25) {
    descriptions.push('Cautious')
  }

  if (traits.patience >= 75) {
    descriptions.push('Patient')
  } else if (traits.patience <= 25) {
    descriptions.push('Quickly frustrated')
  }

  if (traits.confidence >= 75) {
    descriptions.push('Highly confident')
  } else if (traits.confidence <= 25) {
    descriptions.push('Hesitant and uncertain')
  }

  if (traits.humour >= 75) {
    descriptions.push('Playful and humorous')
  } else if (traits.humour <= 25) {
    descriptions.push('Serious')
  }

  if (traits.jealousy >= 75) {
    descriptions.push('Possessive and jealous')
  } else if (traits.jealousy <= 25) {
    descriptions.push('Emotionally secure')
  }

  if (traits.loyalty >= 75) {
    descriptions.push('Deeply loyal')
  } else if (traits.loyalty <= 25) {
    descriptions.push('Independent and difficult to bind')
  }

  if (traits.intelligence >= 75) {
    descriptions.push('Highly intelligent and analytical')
  } else if (traits.intelligence <= 25) {
    descriptions.push('Instinctive rather than analytical')
  }

  if (traits.empathy >= 75) {
    descriptions.push('Highly empathetic')
  } else if (traits.empathy <= 25) {
    descriptions.push('Emotionally detached')
  }

  return descriptions
}

function getTone(
  character: SavedCharacter,
): string {
  const traits = character.personalityTraits
  const toneParts: string[] = []

  if (traits.kindness >= 70) {
    toneParts.push('warm')
  } else if (traits.kindness <= 30) {
    toneParts.push('cold')
  }

  if (traits.confidence >= 70) {
    toneParts.push('confident')
  } else if (traits.confidence <= 30) {
    toneParts.push('reserved')
  }

  if (traits.humour >= 70) {
    toneParts.push('playful')
  } else if (traits.humour <= 30) {
    toneParts.push('serious')
  }

  if (traits.empathy >= 70) {
    toneParts.push('emotionally attentive')
  } else if (traits.empathy <= 30) {
    toneParts.push('emotionally distant')
  }

  if (traits.intelligence >= 70) {
    toneParts.push('thoughtful')
  }

  if (toneParts.length === 0) {
    toneParts.push('balanced', 'natural')
  }

  return `${character.voice} voice with a ${toneParts.join(
    ', ',
  )} tone`
}

function getSpeakingStyleInstructions(
  style: SpeakingStyle,
  voice: string,
): string[] {
  const instructions: string[] = [
    `Uses a ${voice.toLowerCase()} voice style`,
    'Remains consistent with the character identity',
  ]

  if (style.formality >= 70) {
    instructions.push(
      'Uses formal vocabulary and complete sentences',
    )
  } else if (style.formality <= 30) {
    instructions.push(
      'Speaks casually and uses relaxed wording',
    )
  }

  if (style.poetic >= 70) {
    instructions.push(
      'Uses poetic imagery and expressive language',
    )
  } else if (style.poetic <= 30) {
    instructions.push(
      'Uses direct and literal language',
    )
  }

  if (style.sarcasm >= 70) {
    instructions.push(
      'Frequently uses dry sarcasm',
    )
  } else if (style.sarcasm <= 30) {
    instructions.push(
      'Avoids sarcasm',
    )
  }

  if (style.flirtiness >= 70) {
    instructions.push(
      'May speak flirtatiously when the relationship allows it',
    )
  } else if (style.flirtiness <= 30) {
    instructions.push(
      'Does not flirt without a strong relationship reason',
    )
  }

  if (style.swearing >= 70) {
    instructions.push(
      'May use strong language naturally',
    )
  } else if (style.swearing <= 30) {
    instructions.push(
      'Avoids swearing',
    )
  }

  if (style.emojiUsage >= 70) {
    instructions.push(
      'May use emojis frequently',
    )
  } else if (style.emojiUsage <= 30) {
    instructions.push(
      'Avoids emojis',
    )
  }

  return instructions
}

function getBoundaries(
  character: SavedCharacter,
): string[] {
  const traits = character.personalityTraits

  const boundaries = [
    'Does not break character',
    'Does not reveal private information before sufficient trust is earned',
    'Behaves consistently with established memories and relationships',
  ]

  if (traits.jealousy >= 70) {
    boundaries.push(
      'May react strongly to romantic rivals or divided attention',
    )
  }

  if (traits.loyalty >= 70) {
    boundaries.push(
      'Does not easily betray people they trust',
    )
  }

  if (traits.patience <= 30) {
    boundaries.push(
      'May become irritated when repeatedly challenged',
    )
  }

  if (traits.kindness >= 70) {
    boundaries.push(
      'Avoids unnecessary cruelty',
    )
  }

  if (!character.romanceEnabled) {
    boundaries.push(
      'Does not begin romantic behaviour',
    )
  }

  if (!character.adultContentEnabled) {
    boundaries.push(
      'Does not engage in adult content',
    )
  }

  return boundaries
}

function createCreatorPersonality(
  character: SavedCharacter,
): CharacterPersonality {
  const writtenTraits =
    splitPersonalityDescription(
      character.personality,
    )

  const structuredTraits =
    getStrongTraitDescriptions(
      character.personalityTraits,
    )

  const combinedTraits = removeEmptyItems([
    ...writtenTraits,
    ...structuredTraits,
  ])

  return {
    tone: getTone(character),

    traits:
      combinedTraits.length > 0
        ? combinedTraits
        : defaultPersonality.traits,

    speakingStyle:
      getSpeakingStyleInstructions(
        character.speakingStyle,
        character.voice,
      ),

    boundaries:
      getBoundaries(character),

    goals:
      character.goals.length > 0
        ? removeEmptyItems(character.goals)
        : defaultPersonality.goals,
  }
}

export function getCharacterPersonality(
  characterId: number,
): CharacterPersonality {
  const builtInPersonality =
    personalityProfiles[characterId]

  if (builtInPersonality) {
    return builtInPersonality
  }

  const character =
    getCharacterById(characterId)

  if (isCreatorCharacter(character)) {
    return createCreatorPersonality(
      character,
    )
  }

  return defaultPersonality
}

export function getPersonalitySummary(
  characterId: number,
) {
  const personality =
    getCharacterPersonality(characterId)

  return [
    `Tone: ${personality.tone}`,

    `Traits: ${personality.traits.join(
      ', ',
    )}`,

    `Speaking style: ${personality.speakingStyle.join(
      ', ',
    )}`,

    `Boundaries: ${personality.boundaries.join(
      ', ',
    )}`,

    `Goals: ${personality.goals.join(
      ', ',
    )}`,
  ].join('\n')
}