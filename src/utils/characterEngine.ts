import {
  getCharacterMemory,
  getRelationshipProgress,
  getRelationshipStage,
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

export type CharacterEngineContext = {
  characterId: number
  memory: CharacterMemory
  mood: MoodState
  personality: CharacterPersonality
  brain: CharacterBrain
  relationshipStage: RelationshipStage
  relationshipProgress: RelationshipProgress
}

export function getCharacterEngineContext(
  characterId: number,
): CharacterEngineContext {
  const memory = getCharacterMemory(characterId)

  return {
    characterId,
    memory,
    mood: getCharacterMood(characterId),
    personality:
      getCharacterPersonality(characterId),
    brain: getCharacterBrain(characterId),
    relationshipStage:
      getRelationshipStage(
        memory.relationshipScore,
      ),
    relationshipProgress:
      getRelationshipProgress(
        memory.relationshipScore,
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
  relationshipStage: RelationshipStage,
) {
  switch (relationshipStage) {
    case 'Hostile':
      return 'The character distrusts the user and remains guarded.'

    case 'Stranger':
      return 'The character is polite but emotionally distant.'

    case 'Acquaintance':
      return 'The character is becoming more comfortable with the user.'

    case 'Friend':
      return 'The character is warm and increasingly open.'

    case 'Close Friend':
      return 'The character trusts the user and speaks personally.'

    case 'Trusted':
      return 'The character is deeply trusting and emotionally honest.'

    case 'Best Friend':
      return 'The character is highly familiar, loyal, and emotionally open.'

    case 'Soulmate':
      return 'The character feels profound emotional closeness and complete trust.'
  }
}

export function getCharacterEngineSummary(
  characterId: number,
) {
  const context =
    getCharacterEngineContext(characterId)

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
      ? `Likes: ${context.memory.likes.join(', ')}`
      : 'Likes: None remembered',

    context.memory.dislikes.length > 0
      ? `Dislikes: ${context.memory.dislikes.join(', ')}`
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
    `Traits: ${context.personality.traits.join(', ')}`,
    `Mood: ${context.mood.mood}`,
    `Mood intensity: ${context.mood.intensity}/5`,
    `Mood reason: ${context.mood.reason}`,
    `Mood instruction: ${getMoodInstruction(
      context.mood,
    )}`,
    `Relationship: ${context.relationshipStage}`,
    `Relationship instruction: ${getRelationshipInstruction(
      context.relationshipStage,
    )}`,
    `Relationship progress: ${context.relationshipProgress.progressPercent}%`,
    ...memorySummary,
    `Knowledge: ${context.brain.knowledge.join(', ')}`,
    `Goals: ${context.brain.motivations.join(', ')}`,
    `Fears: ${context.brain.fears.join(', ')}`,
  ].join('\n')
}