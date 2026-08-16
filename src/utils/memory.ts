export type CharacterExperienceType =
  | 'promise'
  | 'support'
  | 'conflict'
  | 'boundary'
  | 'relationship_moment'
  | 'shared_experience'


export type CharacterExperienceMemory = {
  id: string
  type: CharacterExperienceType
  summary: string
  importance: number
  emotionalWeight: number
  createdAt: string
}


export type CharacterMemory = {
  userName?: string
  favouriteColour?: string
  favouriteFood?: string
  likes: string[]
  dislikes: string[]
  importantFacts: string[]
  experiences: CharacterExperienceMemory[]
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

const memoryStoragePrefix =
  'velvetverse-memory'

function createDefaultMemory():
  CharacterMemory {
  return {
    likes: [],
    dislikes: [],
    importantFacts: [],
    experiences: [],
    relationshipScore: 0,
    updatedAt:
      new Date().toISOString(),
  }
}

function getMemoryStorageKey(
  characterId: number,
) {
  return `${memoryStoragePrefix}-${characterId}`
}

export function getRelationshipStage(
  relationshipScore: number,
): RelationshipStage {
  if (
    relationshipScore <= -6
  ) {
    return 'Hostile'
  }

  if (
    relationshipScore <= 0
  ) {
    return 'Stranger'
  }

  if (
    relationshipScore <= 2
  ) {
    return 'Acquaintance'
  }

  if (
    relationshipScore <= 4
  ) {
    return 'Friend'
  }

  if (
    relationshipScore <= 6
  ) {
    return 'Close Friend'
  }

  if (
    relationshipScore <= 8
  ) {
    return 'Trusted'
  }

  if (
    relationshipScore <= 9
  ) {
    return 'Best Friend'
  }

  return 'Soulmate'
}

export function getCharacterMemory(
  characterId: number,
): CharacterMemory {
  const storageKey =
    getMemoryStorageKey(
      characterId,
    )

  try {
    const savedMemory =
      localStorage.getItem(
        storageKey,
      )

    if (!savedMemory) {
      return createDefaultMemory()
    }

    const parsedMemory =
      JSON.parse(
        savedMemory,
      ) as Partial<CharacterMemory>

    return {
      userName:
        parsedMemory.userName,

      favouriteColour:
        parsedMemory.favouriteColour,

      favouriteFood:
        parsedMemory.favouriteFood,

      likes:
        Array.isArray(
          parsedMemory.likes,
        )
          ? parsedMemory.likes
          : [],

      dislikes:
        Array.isArray(
          parsedMemory.dislikes,
        )
          ? parsedMemory.dislikes
          : [],

      importantFacts:
        Array.isArray(
          parsedMemory.importantFacts,
        )
          ? parsedMemory.importantFacts
          : [],

      experiences:
        Array.isArray(
          parsedMemory.experiences,
        )
          ? parsedMemory.experiences
          : [],

      relationshipScore:
        typeof parsedMemory.relationshipScore ===
        'number'
          ? parsedMemory.relationshipScore
          : 0,

      updatedAt:
        typeof parsedMemory.updatedAt ===
        'string'
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
  const storageKey =
    getMemoryStorageKey(
      characterId,
    )

  localStorage.setItem(
    storageKey,

    JSON.stringify({
      ...memory,

      updatedAt:
        new Date().toISOString(),
    }),
  )
}

export function rememberUserMessage(
  characterId: number,
  userMessage: string,
): CharacterMemory {
  const currentMemory =
    getCharacterMemory(
      characterId,
    )

  const updatedMemory:
    CharacterMemory = {
    ...currentMemory,

    likes: [
      ...currentMemory.likes,
    ],

    dislikes: [
      ...currentMemory.dislikes,
    ],

    importantFacts: [
      ...currentMemory.importantFacts,
    ],

    experiences: [
      ...currentMemory.experiences,
    ],
  }

  const nameMatch =
    userMessage.match(
      /(?:my name is|call me)\s+([a-zA-Z'-]+)/i,
    )

  if (
    nameMatch?.[1]
  ) {
    updatedMemory.userName =
      nameMatch[1]
  }

  const colourMatch =
    userMessage.match(
      /my favou?rite colou?r is\s+([a-zA-Z]+)/i,
    )

  if (
    colourMatch?.[1]
  ) {
    updatedMemory.favouriteColour =
      colourMatch[1]
  }

  const foodMatch =
    userMessage.match(
      /my favou?rite food is\s+(.+)/i,
    )

  if (
    foodMatch?.[1]
  ) {
    updatedMemory.favouriteFood =
      foodMatch[1].trim()
  }

  const likeMatch =
    userMessage.match(
      /(?:i like|i love|i enjoy)\s+(.+)/i,
    )

  if (
    likeMatch?.[1]
  ) {
    const newLike =
      likeMatch[1].trim()

    if (
      newLike &&
      !updatedMemory.likes.some(
        (item) =>
          item.toLowerCase() ===
          newLike.toLowerCase(),
      )
    ) {
      updatedMemory.likes.push(
        newLike,
      )
    }
  }

  const dislikeMatch =
    userMessage.match(
      /(?:i dislike|i hate|i do not like|i don't like)\s+(.+)/i,
    )

  if (
    dislikeMatch?.[1]
  ) {
    const newDislike =
      dislikeMatch[1].trim()

    if (
      newDislike &&
      !updatedMemory.dislikes.some(
        (item) =>
          item.toLowerCase() ===
          newDislike.toLowerCase(),
      )
    ) {
      updatedMemory.dislikes.push(
        newDislike,
      )
    }
  }

  const importantFactMatch =
    userMessage.match(
      /(?:remember that|important fact|you should know that)\s+(.+)/i,
    )

  if (
    importantFactMatch?.[1]
  ) {
    const newFact =
      importantFactMatch[1]
        .trim()

    if (
      newFact &&
      !updatedMemory.importantFacts.some(
        (item) =>
          item.toLowerCase() ===
          newFact.toLowerCase(),
      )
    ) {
      updatedMemory
        .importantFacts
        .push(
          newFact,
        )
    }
  }

  saveCharacterMemory(
    characterId,
    updatedMemory,
  )

  return updatedMemory
}


type PerceivedMemoryAssessment = {
  supportive: number
  respectful: number
  flirtatious: number
  romantic: number
  vulnerable: number
  loyal: number
  playful: number
  socialInvitation: number
  rude: number
  pressuring: number
  dishonest: number
  hostile: number
}


type RememberPerceivedInteractionArgs = {
  characterId: number
  perceivedInteraction: string
  assessment: PerceivedMemoryAssessment
}


function addUniqueValue(
  values: string[],
  value: string,
) {
  const cleaned =
    value.trim()

  if (
    !cleaned ||
    values.some(
      (item) =>
        item
          .toLowerCase()
          .trim() ===
        cleaned
          .toLowerCase()
          .trim(),
    )
  ) {
    return
  }

  values.push(
    cleaned,
  )
}


function createExperienceId(
  characterId: number,
) {
  return `${characterId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}


function addExperience(
  memory: CharacterMemory,
  characterId: number,
  type: CharacterExperienceType,
  summary: string,
  importance: number,
  emotionalWeight: number,
) {
  const cleaned =
    summary.trim()

  if (!cleaned) {
    return
  }

  const duplicate =
    memory.experiences.some(
      (experience) =>
        experience.type ===
          type &&
        experience.summary
          .toLowerCase()
          .trim() ===
        cleaned
          .toLowerCase()
          .trim(),
    )

  if (duplicate) {
    return
  }

  memory.experiences.push({
    id:
      createExperienceId(
        characterId,
      ),

    type,

    summary:
      cleaned,

    importance:
      Math.max(
        0,
        Math.min(
          100,
          importance,
        ),
      ),

    emotionalWeight:
      Math.max(
        0,
        Math.min(
          100,
          emotionalWeight,
        ),
      ),

    createdAt:
      new Date().toISOString(),
  })
}


function getPerceivedDialogue(
  perceivedInteraction: string,
) {
  return perceivedInteraction
    .split('\n')
    .filter(
      (line) =>
        line.startsWith(
          'Spoken dialogue:',
        ),
    )
    .map(
      (line) =>
        line
          .replace(
            /^Spoken dialogue:\s*/i,
            '',
          )
          .trim(),
    )
    .filter(Boolean)
    .join(' ')
    .trim()
}


export function rememberPerceivedInteraction({
  characterId,
  perceivedInteraction,
  assessment,
}: RememberPerceivedInteractionArgs):
CharacterMemory {
  const currentMemory =
    getCharacterMemory(
      characterId,
    )

  if (
    !perceivedInteraction.trim()
  ) {
    return currentMemory
  }

  const updatedMemory:
    CharacterMemory = {
    ...currentMemory,

    likes: [
      ...currentMemory.likes,
    ],

    dislikes: [
      ...currentMemory.dislikes,
    ],

    importantFacts: [
      ...currentMemory.importantFacts,
    ],

    experiences: [
      ...currentMemory.experiences,
    ],
  }

  /*
   * Facts are extracted ONLY from dialogue
   * the character actually heard.
   */

  const heardDialogue =
    getPerceivedDialogue(
      perceivedInteraction,
    )

  if (
    heardDialogue
  ) {
    const nameMatch =
      heardDialogue.match(
        /(?:my name is|call me)\s+([a-zA-Z'-]+)/i,
      )

    if (
      nameMatch?.[1]
    ) {
      updatedMemory.userName =
        nameMatch[1]
    }

    const colourMatch =
      heardDialogue.match(
        /my favou?rite colou?r is\s+([a-zA-Z]+)/i,
      )

    if (
      colourMatch?.[1]
    ) {
      updatedMemory.favouriteColour =
        colourMatch[1]
    }

    const foodMatch =
      heardDialogue.match(
        /my favou?rite food is\s+(.+?)(?:[.!?]|$)/i,
      )

    if (
      foodMatch?.[1]
    ) {
      updatedMemory.favouriteFood =
        foodMatch[1].trim()
    }

    const likeMatch =
      heardDialogue.match(
        /(?:i like|i love|i enjoy)\s+(.+?)(?:[.!?]|$)/i,
      )

    if (
      likeMatch?.[1]
    ) {
      addUniqueValue(
        updatedMemory.likes,
        likeMatch[1],
      )
    }

    const dislikeMatch =
      heardDialogue.match(
        /(?:i dislike|i hate|i do not like|i don't like)\s+(.+?)(?:[.!?]|$)/i,
      )

    if (
      dislikeMatch?.[1]
    ) {
      addUniqueValue(
        updatedMemory.dislikes,
        dislikeMatch[1],
      )
    }

    const importantFactMatch =
      heardDialogue.match(
        /(?:remember that|important fact|you should know that)\s+(.+?)(?:[.!?]|$)/i,
      )

    if (
      importantFactMatch?.[1]
    ) {
      addUniqueValue(
        updatedMemory.importantFacts,
        importantFactMatch[1],
      )
    }
  }

  /*
   * Significant shared experiences use the
   * semantic assessment already produced by
   * the relationship pipeline.
   */

  if (
    assessment.hostile >=
      0.7 ||
    assessment.rude >=
      0.75
  ) {
    addExperience(
      updatedMemory,
      characterId,
      'conflict',
      perceivedInteraction,
      80,
      85,
    )
  } else if (
    assessment.pressuring >=
      0.6
  ) {
    addExperience(
      updatedMemory,
      characterId,
      'boundary',
      perceivedInteraction,
      80,
      80,
    )
  } else if (
    assessment.supportive >=
      0.8
  ) {
    addExperience(
      updatedMemory,
      characterId,
      'support',
      perceivedInteraction,
      70,
      65,
    )
  } else if (
    assessment.romantic >=
      0.8 &&
    assessment.respectful >=
      0.6
  ) {
    addExperience(
      updatedMemory,
      characterId,
      'relationship_moment',
      perceivedInteraction,
      70,
      70,
    )
  } else if (
    assessment.vulnerable >=
      0.8 ||
    assessment.loyal >=
      0.8
  ) {
    addExperience(
      updatedMemory,
      characterId,
      'shared_experience',
      perceivedInteraction,
      70,
      70,
    )
  }

  if (
    heardDialogue &&
    /\b(i promise|i swear|you have my word|i give you my word)\b/i
      .test(
        heardDialogue,
      )
  ) {
    addExperience(
      updatedMemory,
      characterId,
      'promise',
      heardDialogue,
      90,
      75,
    )
  }

  /*
   * Keep the list bounded for the local
   * browser prototype. Highest-value recent
   * memories remain available.
   */

  if (
    updatedMemory.experiences.length >
      100
  ) {
    updatedMemory.experiences =
      updatedMemory.experiences
        .slice(-100)
  }

  saveCharacterMemory(
    characterId,
    updatedMemory,
  )

  console.log(
    '[VelvetVerse Persistent Memory]',
    {
      characterId,
      perceivedInteraction,
      experiences:
        updatedMemory.experiences,
    },
  )

  return updatedMemory
}


export function getRelevantExperienceMemories(
  characterId: number,
  limit: number = 6,
) {
  return getCharacterMemory(
    characterId,
  )
    .experiences
    .slice()
    .sort(
      (a, b) =>
        (
          b.importance +
          b.emotionalWeight
        ) -
        (
          a.importance +
          a.emotionalWeight
        ),
    )
    .slice(
      0,
      limit,
    )
}


export function clearCharacterMemory(
  characterId: number,
) {
  localStorage.removeItem(
    getMemoryStorageKey(
      characterId,
    ),
  )
}

export function getRelationshipProgress(
  relationshipScore: number,
): RelationshipProgress {
  const score =
    Math.max(
      -10,
      Math.min(
        10,
        relationshipScore,
      ),
    )

  const currentStage =
    getRelationshipStage(
      score,
    )

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
        minimum: -10,
        nextStage: 'Stranger',
        nextMinimum: -5,
      },

      Stranger: {
        minimum: -5,
        nextStage:
          'Acquaintance',
        nextMinimum: 1,
      },

      Acquaintance: {
        minimum: 1,
        nextStage: 'Friend',
        nextMinimum: 3,
      },

      Friend: {
        minimum: 3,
        nextStage:
          'Close Friend',
        nextMinimum: 5,
      },

      'Close Friend': {
        minimum: 5,
        nextStage: 'Trusted',
        nextMinimum: 7,
      },

      Trusted: {
        minimum: 7,
        nextStage:
          'Best Friend',
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

      nextStage: null,

      currentScore:
        score,

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
    score -
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
      score,

    stageMinimum:
      range.minimum,

    nextStageMinimum:
      range.nextMinimum,

    progressPercent,
  }
}