export type CharacterMemory = {
  userName?: string
  favouriteColour?: string
  favouriteFood?: string
  likes: string[]
  dislikes: string[]
  importantFacts: string[]
  relationshipScore: number
  updatedAt: string
}

export type RelationshipStage =
  | 'Hostile'
  | 'Stranger'
  | 'Acquaintance'
  | 'Friend'
  | 'Close Friend'
  | 'Trusted'
  | 'Best Friend'
  | 'Soulmate'
  export type RelationshipProgress = {
  currentStage: RelationshipStage
  nextStage: RelationshipStage | null
  currentScore: number
  stageMinimum: number
  nextStageMinimum: number | null
  progressPercent: number
}

const memoryStoragePrefix = 'velvetverse-memory'

function createDefaultMemory(): CharacterMemory {
  return {
    likes: [],
    dislikes: [],
    importantFacts: [],
    relationshipScore: 0,
    updatedAt: new Date().toISOString(),
  }
}

function getMemoryStorageKey(characterId: number) {
  return `${memoryStoragePrefix}-${characterId}`
}

export function getRelationshipStage(
  relationshipScore: number,
): RelationshipStage {
  if (relationshipScore <= -6) {
    return 'Hostile'
  }

  if (relationshipScore <= 0) {
    return 'Stranger'
  }

  if (relationshipScore <= 2) {
    return 'Acquaintance'
  }

  if (relationshipScore <= 4) {
    return 'Friend'
  }

  if (relationshipScore <= 6) {
    return 'Close Friend'
  }

  if (relationshipScore <= 8) {
    return 'Trusted'
  }

  if (relationshipScore <= 9) {
    return 'Best Friend'
  }

  return 'Soulmate'
}

export function getCharacterMemory(
  characterId: number,
): CharacterMemory {
  const storageKey = getMemoryStorageKey(characterId)

  try {
    const savedMemory = localStorage.getItem(storageKey)

    if (!savedMemory) {
      return createDefaultMemory()
    }

    const parsedMemory =
      JSON.parse(savedMemory) as Partial<CharacterMemory>

    return {
      userName: parsedMemory.userName,
      favouriteColour: parsedMemory.favouriteColour,
      favouriteFood: parsedMemory.favouriteFood,
      likes: Array.isArray(parsedMemory.likes)
        ? parsedMemory.likes
        : [],
      dislikes: Array.isArray(parsedMemory.dislikes)
        ? parsedMemory.dislikes
        : [],
      importantFacts: Array.isArray(
        parsedMemory.importantFacts,
      )
        ? parsedMemory.importantFacts
        : [],
      relationshipScore:
        typeof parsedMemory.relationshipScore === 'number'
          ? parsedMemory.relationshipScore
          : 0,
      updatedAt:
        typeof parsedMemory.updatedAt === 'string'
          ? parsedMemory.updatedAt
          : new Date().toISOString(),
    }
  } catch {
    return createDefaultMemory()
  }
}

export function saveCharacterMemory(
  characterId: number,
  memory: CharacterMemory,
) {
  const storageKey = getMemoryStorageKey(characterId)

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...memory,
      updatedAt: new Date().toISOString(),
    }),
  )
}

export function rememberUserMessage(
  characterId: number,
  userMessage: string,
): CharacterMemory {
  const currentMemory = getCharacterMemory(characterId)
  const lowerMessage = userMessage.toLowerCase()

  const updatedMemory: CharacterMemory = {
    ...currentMemory,
    likes: [...currentMemory.likes],
    dislikes: [...currentMemory.dislikes],
    importantFacts: [...currentMemory.importantFacts],
  }

  const nameMatch = userMessage.match(
    /(?:my name is|call me)\s+([a-zA-Z'-]+)/i,
  )

  if (nameMatch?.[1]) {
    updatedMemory.userName = nameMatch[1]
  }

  const colourMatch = userMessage.match(
    /my favou?rite colou?r is\s+([a-zA-Z]+)/i,
  )

  if (colourMatch?.[1]) {
    updatedMemory.favouriteColour = colourMatch[1]
  }

  const foodMatch = userMessage.match(
    /my favou?rite food is\s+(.+)/i,
  )

  if (foodMatch?.[1]) {
    updatedMemory.favouriteFood =
      foodMatch[1].trim()
  }

  const likeMatch = userMessage.match(
    /(?:i like|i love|i enjoy)\s+(.+)/i,
  )

  if (likeMatch?.[1]) {
    const newLike = likeMatch[1].trim()

    if (
      newLike &&
      !updatedMemory.likes.some(
        (item) =>
          item.toLowerCase() === newLike.toLowerCase(),
      )
    ) {
      updatedMemory.likes.push(newLike)
    }
  }

  const dislikeMatch = userMessage.match(
    /(?:i dislike|i hate|i do not like|i don't like)\s+(.+)/i,
  )

  if (dislikeMatch?.[1]) {
    const newDislike = dislikeMatch[1].trim()

    if (
      newDislike &&
      !updatedMemory.dislikes.some(
        (item) =>
          item.toLowerCase() ===
          newDislike.toLowerCase(),
      )
    ) {
      updatedMemory.dislikes.push(newDislike)
    }
  }

  const importantFactMatch = userMessage.match(
    /(?:remember that|important fact|you should know that)\s+(.+)/i,
  )

  if (importantFactMatch?.[1]) {
    const newFact = importantFactMatch[1].trim()

    if (
      newFact &&
      !updatedMemory.importantFacts.some(
        (item) =>
          item.toLowerCase() === newFact.toLowerCase(),
      )
    ) {
      updatedMemory.importantFacts.push(newFact)
    }
  }

  if (
    lowerMessage.includes('thank you') ||
    lowerMessage.includes('thanks') ||
    lowerMessage.includes('you are kind') ||
    lowerMessage.includes('i trust you') ||
    lowerMessage.includes('i appreciate you')
  ) {
    updatedMemory.relationshipScore += 1
  }

  if (
    lowerMessage.includes('i love you') ||
    lowerMessage.includes('you mean a lot to me')
  ) {
    updatedMemory.relationshipScore += 2
  }

  if (
    lowerMessage.includes('i hate you') ||
    lowerMessage.includes('you are awful') ||
    lowerMessage.includes('leave me alone')
  ) {
    updatedMemory.relationshipScore -= 2
  }

  if (
    lowerMessage.includes('you annoy me') ||
    lowerMessage.includes('i do not trust you') ||
    lowerMessage.includes("i don't trust you")
  ) {
    updatedMemory.relationshipScore -= 1
  }

  updatedMemory.relationshipScore = Math.max(
    -10,
    Math.min(10, updatedMemory.relationshipScore),
  )

  saveCharacterMemory(characterId, updatedMemory)

  return updatedMemory
}

export function clearCharacterMemory(
  characterId: number,
) {
  localStorage.removeItem(
    getMemoryStorageKey(characterId),
  )
}export function getRelationshipProgress(
  relationshipScore: number,
): RelationshipProgress {
  const score = Math.max(-10, Math.min(10, relationshipScore))
  const currentStage = getRelationshipStage(score)

  const stageRanges: Record<
    RelationshipStage,
    {
      minimum: number
      nextStage: RelationshipStage | null
      nextMinimum: number | null
    }
  > = {
    Hostile: {
      minimum: -10,
      nextStage: 'Stranger',
      nextMinimum: -5,
    },

    Stranger: {
      minimum: -5,
      nextStage: 'Acquaintance',
      nextMinimum: 1,
    },

    Acquaintance: {
      minimum: 1,
      nextStage: 'Friend',
      nextMinimum: 3,
    },

    Friend: {
      minimum: 3,
      nextStage: 'Close Friend',
      nextMinimum: 5,
    },

    'Close Friend': {
      minimum: 5,
      nextStage: 'Trusted',
      nextMinimum: 7,
    },

    Trusted: {
      minimum: 7,
      nextStage: 'Best Friend',
      nextMinimum: 9,
    },

    'Best Friend': {
      minimum: 9,
      nextStage: 'Soulmate',
      nextMinimum: 10,
    },

    Soulmate: {
      minimum: 10,
      nextStage: null,
      nextMinimum: null,
    },
  }

  const range = stageRanges[currentStage]

  if (
    range.nextStage === null ||
    range.nextMinimum === null
  ) {
    return {
      currentStage,
      nextStage: null,
      currentScore: score,
      stageMinimum: range.minimum,
      nextStageMinimum: null,
      progressPercent: 100,
    }
  }

  const totalRange =
    range.nextMinimum - range.minimum

  const progressInRange =
    score - range.minimum

  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (progressInRange / totalRange) * 100,
      ),
    ),
  )

  return {
    currentStage,
    nextStage: range.nextStage,
    currentScore: score,
    stageMinimum: range.minimum,
    nextStageMinimum: range.nextMinimum,
    progressPercent,
  }
}