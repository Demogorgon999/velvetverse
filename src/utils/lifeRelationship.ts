import type {
  CharacterMemory,
  RelationshipStage,
} from './memory'

import type {
  MoodState,
} from './mood'

type LifeRelationshipArgs = {
  relationshipStage: RelationshipStage
  mood: MoodState
  memory: CharacterMemory
  originalHook: string
}

function getRelationshipPrefix(
  relationshipStage: RelationshipStage,
  memory: CharacterMemory,
) {
  const userName =
    memory.userName?.trim()

  switch (relationshipStage) {
    case 'Hostile':
      return userName
        ? `${userName}, `
        : ''

    case 'Stranger':
      return ''

    case 'Acquaintance':
      return userName
        ? `${userName}, `
        : ''

    case 'Friend':
      return userName
        ? `${userName}, I thought you might want to know that `
        : 'I thought you might want to know that '

    case 'Close Friend':
      return userName
        ? `${userName}, I kept thinking you would want to hear that `
        : 'I kept thinking you would want to hear that '

    case 'Trusted':
      return userName
        ? `${userName}, I wanted to tell you this myself: `
        : 'I wanted to tell you this myself: '

    case 'Best Friend':
      return userName
        ? `${userName}, you were the first person I wanted to tell. `
        : 'You were the first person I wanted to tell. '

    case 'Soulmate':
      return userName
        ? `${userName}... I kept wishing you were here. `
        : 'I kept wishing you were here. '
  }
}

function getMoodSuffix(
  mood: MoodState,
) {
  switch (mood.mood) {
    case 'Affectionate':
      return ' I am glad you came back.'

    case 'Protective':
      return ' I would rather you hear this from me than anyone else.'

    case 'Playful':
      return ' You really do have a habit of missing the interesting parts.'

    case 'Curious':
      return ' I have been wondering what you will make of it.'

    case 'Irritated':
      return ' Do not make me repeat myself.'

    case 'Suspicious':
      return ' I am still deciding how much I should tell you.'

    case 'Sad':
      return ' It has been difficult carrying this alone.'

    case 'Calm':
    default:
      return ''
  }
}

export function buildRelationshipLifeHook({
  relationshipStage,
  mood,
  memory,
  originalHook,
}: LifeRelationshipArgs) {
  const prefix =
    getRelationshipPrefix(
      relationshipStage,
      memory,
    )

  const suffix =
    getMoodSuffix(mood)

  const cleanedHook =
    originalHook.trim()

  if (
    relationshipStage === 'Hostile'
  ) {
    return `${prefix}${cleanedHook} Do not mistake my telling you for trust.${suffix}`
  }

  if (
    relationshipStage === 'Stranger'
  ) {
    return `${cleanedHook}${suffix}`
  }

  if (
    relationshipStage ===
    'Acquaintance'
  ) {
    return `${prefix}${cleanedHook}${suffix}`
  }

  return `${prefix}${cleanedHook}${suffix}`
}