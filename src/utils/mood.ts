export type CharacterMood =
  | 'Calm'
  | 'Curious'
  | 'Playful'
  | 'Affectionate'
  | 'Protective'
  | 'Sad'
  | 'Irritated'
  | 'Suspicious'

export type MoodState = {
  mood: CharacterMood
  intensity: number
  reason: string
  updatedAt: string
}

const moodStoragePrefix = 'velvetverse-mood'

function getMoodStorageKey(characterId: number) {
  return `${moodStoragePrefix}-${characterId}`
}

function createDefaultMood(): MoodState {
  return {
    mood: 'Calm',
    intensity: 1,
    reason: 'The conversation has just begun.',
    updatedAt: new Date().toISOString(),
  }
}

export function getCharacterMood(
  characterId: number,
): MoodState {
  try {
    const savedMood = localStorage.getItem(
      getMoodStorageKey(characterId),
    )

    if (!savedMood) {
      return createDefaultMood()
    }

    const parsedMood =
      JSON.parse(savedMood) as Partial<MoodState>

    return {
      mood:
        typeof parsedMood.mood === 'string'
          ? (parsedMood.mood as CharacterMood)
          : 'Calm',

      intensity:
        typeof parsedMood.intensity === 'number'
          ? Math.max(
              1,
              Math.min(5, parsedMood.intensity),
            )
          : 1,

      reason:
        typeof parsedMood.reason === 'string'
          ? parsedMood.reason
          : 'No recent mood change.',

      updatedAt:
        typeof parsedMood.updatedAt === 'string'
          ? parsedMood.updatedAt
          : new Date().toISOString(),
    }
  } catch {
    return createDefaultMood()
  }
}

export function saveCharacterMood(
  characterId: number,
  moodState: MoodState,
) {
  localStorage.setItem(
    getMoodStorageKey(characterId),
    JSON.stringify({
      ...moodState,
      intensity: Math.max(
        1,
        Math.min(5, moodState.intensity),
      ),
      updatedAt: new Date().toISOString(),
    }),
  )
}

export function updateMoodFromMessage(
  characterId: number,
  userMessage: string,
): MoodState {
  const lowerMessage = userMessage.toLowerCase()

  let nextMood = getCharacterMood(characterId)

  if (
    lowerMessage.includes('thank you') ||
    lowerMessage.includes('you are kind') ||
    lowerMessage.includes('i appreciate you')
  ) {
    nextMood = {
      mood: 'Affectionate',
      intensity: 3,
      reason: 'The user expressed warmth or appreciation.',
      updatedAt: new Date().toISOString(),
    }
  } else if (
    lowerMessage.includes('tell me more') ||
    lowerMessage.includes('why') ||
    lowerMessage.includes('how')
  ) {
    nextMood = {
      mood: 'Curious',
      intensity: 2,
      reason: 'The user encouraged deeper conversation.',
      updatedAt: new Date().toISOString(),
    }
  } else if (
    lowerMessage.includes('beautiful') ||
    lowerMessage.includes('pretty') ||
    lowerMessage.includes('flirt')
  ) {
    nextMood = {
      mood: 'Playful',
      intensity: 3,
      reason: 'The user offered a personal compliment.',
      updatedAt: new Date().toISOString(),
    }
  } else if (
    lowerMessage.includes('sad') ||
    lowerMessage.includes('lonely') ||
    lowerMessage.includes('hurt')
  ) {
    nextMood = {
      mood: 'Protective',
      intensity: 4,
      reason: 'The user appeared emotionally vulnerable.',
      updatedAt: new Date().toISOString(),
    }
  } else if (
    lowerMessage.includes('leave me alone') ||
    lowerMessage.includes('you are awful') ||
    lowerMessage.includes('i hate you')
  ) {
    nextMood = {
      mood: 'Irritated',
      intensity: 4,
      reason: 'The interaction became hostile.',
      updatedAt: new Date().toISOString(),
    }
  } else if (
    lowerMessage.includes('secret') ||
    lowerMessage.includes('what are you hiding') ||
    lowerMessage.includes('do you trust me')
  ) {
    nextMood = {
      mood: 'Suspicious',
      intensity: 2,
      reason: 'The user pressed for private information.',
      updatedAt: new Date().toISOString(),
    }
  } else {
    nextMood = {
      mood: 'Calm',
      intensity: 1,
      reason: 'The conversation remained neutral.',
      updatedAt: new Date().toISOString(),
    }
  }

  saveCharacterMood(characterId, nextMood)

  return nextMood
}

export function clearCharacterMood(
  characterId: number,
) {
  localStorage.removeItem(
    getMoodStorageKey(characterId),
  )
}