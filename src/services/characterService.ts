export type SavedCharacter = {
  id: number
  name: string
  title: string
  category: string
  description: string
  greeting: string
  personality: string
  visibility: string
  world: string
  voice: string
  memoryEnabled: boolean
  romanceEnabled: boolean
  adultContentEnabled: boolean
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

const charactersStorageKey = 'velvetverse-characters'
const legacyDraftStorageKey = 'velvetverse-character-draft'

function createCharacterId() {
  return Date.now()
}

function normalizeCharacter(
  character: Partial<SavedCharacter>,
): SavedCharacter {
  const now = new Date().toISOString()

  return {
    id: character.id ?? createCharacterId(),
    name: character.name ?? '',
    title: character.title ?? '',
    category: character.category ?? 'Fantasy',
    description: character.description ?? '',
    greeting: character.greeting ?? '',
    personality: character.personality ?? '',
    visibility: character.visibility ?? 'Private',
    world: character.world ?? '',
    voice: character.voice ?? 'Elegant',
    memoryEnabled: character.memoryEnabled ?? true,
    romanceEnabled: character.romanceEnabled ?? false,
    adultContentEnabled:
      character.adultContentEnabled ?? false,
    status: character.status ?? 'draft',
    createdAt: character.createdAt ?? now,
    updatedAt: character.updatedAt ?? now,
  }
}

function readStoredCharacters(): SavedCharacter[] {
  try {
    const storedCharacters = localStorage.getItem(
      charactersStorageKey,
    )

    if (!storedCharacters) {
      return []
    }

    const parsedCharacters = JSON.parse(storedCharacters)

    if (!Array.isArray(parsedCharacters)) {
      return []
    }

    return parsedCharacters.map((character) =>
      normalizeCharacter(character),
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
  const existingCharacters = readStoredCharacters()

  if (existingCharacters.length > 0) {
    return existingCharacters
  }

  try {
    const legacyDraft = localStorage.getItem(
      legacyDraftStorageKey,
    )

    if (!legacyDraft) {
      return existingCharacters
    }

    const parsedDraft = JSON.parse(legacyDraft)

    const migratedCharacter = normalizeCharacter({
      ...parsedDraft,
      status: 'draft',
    })

    writeStoredCharacters([migratedCharacter])

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
    (character) => character.id === characterId,
  )
}

export function createCharacter(
  character: Omit<
    SavedCharacter,
    'id' | 'createdAt' | 'updatedAt'
  >,
): SavedCharacter {
  const characters = getCharacters()

  const newCharacter = normalizeCharacter({
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

  let updatedCharacter: SavedCharacter | null = null

  const updatedCharacters = characters.map((character) => {
    if (character.id !== characterId) {
      return character
    }

    updatedCharacter = normalizeCharacter({
      ...character,
      ...updates,
      id: character.id,
      createdAt: character.createdAt,
      updatedAt: new Date().toISOString(),
    })

    return updatedCharacter
  })

  writeStoredCharacters(updatedCharacters)

  return updatedCharacter
}

export function deleteCharacter(
  characterId: number,
) {
  const remainingCharacters = getCharacters().filter(
    (character) => character.id !== characterId,
  )

  writeStoredCharacters(remainingCharacters)
}

export function duplicateCharacter(
  characterId: number,
): SavedCharacter | null {
  const character = getCharacterById(characterId)

  if (!character) {
    return null
  }

  return createCharacter({
    ...character,
    name: character.name
      ? `${character.name} Copy`
      : 'Untitled Character Copy',
    status: 'draft',
  })
}

export function publishCharacter(
  characterId: number,
): SavedCharacter | null {
  return updateCharacter(characterId, {
    status: 'published',
    visibility: 'Public',
  })
}