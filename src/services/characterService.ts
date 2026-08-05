import {
  createDefaultIdentity,
  createDefaultPersonality,
  createDefaultSpeakingStyle,
} from '../database/defaultTraits'
import type {
  CharacterIdentity,
  CharacterStatus,
  CharacterTemplate,
  PersonalityTraits,
  SpeakingStyle,
} from '../types/characterTemplate'

export type SavedCharacter = CharacterTemplate

type ExistingCreatorFields = Pick<
  SavedCharacter,
  | 'name'
  | 'title'
  | 'category'
  | 'description'
  | 'greeting'
  | 'personality'
  | 'visibility'
  | 'world'
  | 'voice'
  | 'memoryEnabled'
  | 'romanceEnabled'
  | 'adultContentEnabled'
  | 'status'
>

export type CreateCharacterInput =
  ExistingCreatorFields &
    Partial<
      Omit<
        SavedCharacter,
        | keyof ExistingCreatorFields
        | 'id'
        | 'createdAt'
        | 'updatedAt'
      >
    >

const charactersStorageKey =
  'velvetverse-characters'

const legacyDraftStorageKey =
  'velvetverse-character-draft'

function createCharacterId() {
  return Date.now()
}

function clampPercentage(
  value: unknown,
  fallback: number,
) {
  if (typeof value !== 'number') {
    return fallback
  }

  return Math.max(
    0,
    Math.min(100, value),
  )
}

function normalizeStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string',
    )
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeIdentity(
  identity?: Partial<CharacterIdentity>,
): CharacterIdentity {
  const defaults = createDefaultIdentity()

  return {
    species:
      typeof identity?.species === 'string'
        ? identity.species
        : defaults.species,

    age:
      typeof identity?.age === 'string'
        ? identity.age
        : defaults.age,

    role:
      typeof identity?.role === 'string'
        ? identity.role
        : defaults.role,

    homeland:
      typeof identity?.homeland === 'string'
        ? identity.homeland
        : defaults.homeland,
  }
}

function normalizePersonalityTraits(
  traits?: Partial<PersonalityTraits>,
): PersonalityTraits {
  const defaults = createDefaultPersonality()

  return {
    kindness: clampPercentage(
      traits?.kindness,
      defaults.kindness,
    ),

    curiosity: clampPercentage(
      traits?.curiosity,
      defaults.curiosity,
    ),

    bravery: clampPercentage(
      traits?.bravery,
      defaults.bravery,
    ),

    patience: clampPercentage(
      traits?.patience,
      defaults.patience,
    ),

    confidence: clampPercentage(
      traits?.confidence,
      defaults.confidence,
    ),

    humour: clampPercentage(
      traits?.humour,
      defaults.humour,
    ),

    jealousy: clampPercentage(
      traits?.jealousy,
      defaults.jealousy,
    ),

    loyalty: clampPercentage(
      traits?.loyalty,
      defaults.loyalty,
    ),

    intelligence: clampPercentage(
      traits?.intelligence,
      defaults.intelligence,
    ),

    empathy: clampPercentage(
      traits?.empathy,
      defaults.empathy,
    ),
  }
}

function normalizeSpeakingStyle(
  style?: Partial<SpeakingStyle>,
): SpeakingStyle {
  const defaults = createDefaultSpeakingStyle()

  return {
    formality: clampPercentage(
      style?.formality,
      defaults.formality,
    ),

    poetic: clampPercentage(
      style?.poetic,
      defaults.poetic,
    ),

    sarcasm: clampPercentage(
      style?.sarcasm,
      defaults.sarcasm,
    ),

    flirtiness: clampPercentage(
      style?.flirtiness,
      defaults.flirtiness,
    ),

    swearing: clampPercentage(
      style?.swearing,
      defaults.swearing,
    ),

    emojiUsage: clampPercentage(
      style?.emojiUsage,
      defaults.emojiUsage,
    ),
  }
}

function normalizeStatus(
  status: unknown,
): CharacterStatus {
  return status === 'published'
    ? 'published'
    : 'draft'
}

function normalizeCharacter(
  character: Partial<SavedCharacter>,
): SavedCharacter {
  const now = new Date().toISOString()

  return {
    id:
      typeof character.id === 'number'
        ? character.id
        : createCharacterId(),

    creatorId:
      typeof character.creatorId === 'string'
        ? character.creatorId
        : 'local-user',

    name:
      typeof character.name === 'string'
        ? character.name
        : '',

    title:
      typeof character.title === 'string'
        ? character.title
        : '',

    category:
      typeof character.category === 'string'
        ? character.category
        : 'Fantasy',

    identity: normalizeIdentity(
      character.identity,
    ),

    description:
      typeof character.description === 'string'
        ? character.description
        : '',

    biography:
      typeof character.biography === 'string'
        ? character.biography
        : '',

    greeting:
      typeof character.greeting === 'string'
        ? character.greeting
        : '',

    personality:
      typeof character.personality === 'string'
        ? character.personality
        : '',

    personalityTraits:
      normalizePersonalityTraits(
        character.personalityTraits,
      ),

    speakingStyle:
      normalizeSpeakingStyle(
        character.speakingStyle,
      ),

    knowledge: normalizeStringArray(
      character.knowledge,
    ),

    secrets: normalizeStringArray(
      character.secrets,
    ),

    fears: normalizeStringArray(
      character.fears,
    ),

    goals: normalizeStringArray(
      character.goals,
    ),

    likes: normalizeStringArray(
      character.likes,
    ),

    dislikes: normalizeStringArray(
      character.dislikes,
    ),

    world:
      typeof character.world === 'string'
        ? character.world
        : '',

    voice:
      typeof character.voice === 'string'
        ? character.voice
        : 'Elegant',

    memoryEnabled:
      typeof character.memoryEnabled === 'boolean'
        ? character.memoryEnabled
        : true,

    romanceEnabled:
      typeof character.romanceEnabled === 'boolean'
        ? character.romanceEnabled
        : false,

    adultContentEnabled:
      typeof character.adultContentEnabled ===
      'boolean'
        ? character.adultContentEnabled
        : false,

    visibility:
      typeof character.visibility === 'string'
        ? character.visibility
        : 'Private',

    status: normalizeStatus(
      character.status,
    ),

    image:
      typeof character.image === 'string'
        ? character.image
        : '',

    accentColor:
      typeof character.accentColor === 'string'
        ? character.accentColor
        : '#d946ef',

    createdAt:
      typeof character.createdAt === 'string'
        ? character.createdAt
        : now,

    updatedAt:
      typeof character.updatedAt === 'string'
        ? character.updatedAt
        : now,
  }
}

function readStoredCharacters(): SavedCharacter[] {
  try {
    const storedCharacters =
      localStorage.getItem(
        charactersStorageKey,
      )

    if (!storedCharacters) {
      return []
    }

    const parsedCharacters: unknown =
      JSON.parse(storedCharacters)

    if (!Array.isArray(parsedCharacters)) {
      return []
    }

    return parsedCharacters.map(
      (character) =>
        normalizeCharacter(
          character as Partial<SavedCharacter>,
        ),
    )
  } catch {
    return []
  }
}

function writeStoredCharacters(
  characters: SavedCharacter[],
) {
  localStorage.setItem(
    charactersStorageKey,
    JSON.stringify(characters),
  )
}

function migrateLegacyDraft() {
  const existingCharacters =
    readStoredCharacters()

  if (existingCharacters.length > 0) {
    return existingCharacters
  }

  try {
    const legacyDraft =
      localStorage.getItem(
        legacyDraftStorageKey,
      )

    if (!legacyDraft) {
      return existingCharacters
    }

    const parsedDraft: unknown =
      JSON.parse(legacyDraft)

    if (
      typeof parsedDraft !== 'object' ||
      parsedDraft === null
    ) {
      return existingCharacters
    }

    const migratedCharacter =
      normalizeCharacter({
        ...(parsedDraft as Partial<SavedCharacter>),
        status: 'draft',
      })

    writeStoredCharacters([
      migratedCharacter,
    ])

    return [migratedCharacter]
  } catch {
    return existingCharacters
  }
}

export function getCharacters(): SavedCharacter[] {
  return migrateLegacyDraft()
}

export function getCharacterById(
  characterId: number,
): SavedCharacter | undefined {
  return getCharacters().find(
    (character) =>
      character.id === characterId,
  )
}

export function createCharacter(
  character: CreateCharacterInput,
): SavedCharacter {
  const characters = getCharacters()

  const newCharacter =
    normalizeCharacter({
      ...character,
      id: createCharacterId(),
    })

  writeStoredCharacters([
    newCharacter,
    ...characters,
  ])

  return newCharacter
}

export function updateCharacter(
  characterId: number,
  updates: Partial<SavedCharacter>,
): SavedCharacter | null {
  const characters = getCharacters()

  let updatedCharacter:
    | SavedCharacter
    | null = null

  const updatedCharacters =
    characters.map((character) => {
      if (
        character.id !== characterId
      ) {
        return character
      }

      updatedCharacter =
        normalizeCharacter({
          ...character,
          ...updates,

          identity: {
            ...character.identity,
            ...updates.identity,
          },

          personalityTraits: {
            ...character.personalityTraits,
            ...updates.personalityTraits,
          },

          speakingStyle: {
            ...character.speakingStyle,
            ...updates.speakingStyle,
          },

          id: character.id,
          createdAt:
            character.createdAt,
          updatedAt:
            new Date().toISOString(),
        })

      return updatedCharacter
    })

  writeStoredCharacters(
    updatedCharacters,
  )

  return updatedCharacter
}

export function deleteCharacter(
  characterId: number,
) {
  const remainingCharacters =
    getCharacters().filter(
      (character) =>
        character.id !== characterId,
    )

  writeStoredCharacters(
    remainingCharacters,
  )
}

export function duplicateCharacter(
  characterId: number,
): SavedCharacter | null {
  const character =
    getCharacterById(characterId)

  if (!character) {
    return null
  }

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...duplicateData
  } = character

  return createCharacter({
    ...duplicateData,

    name: character.name
      ? `${character.name} Copy`
      : 'Untitled Character Copy',

    status: 'draft',
    visibility: 'Private',
  })
}

export function publishCharacter(
  characterId: number,
): SavedCharacter | null {
  return updateCharacter(
    characterId,
    {
      status: 'published',
      visibility: 'Public',
    },
  )
}