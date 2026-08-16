export type PresenceMode =
  | 'together'
  | 'nearby'
  | 'separated'
  | 'remote'

export type PresenceState = {
  userLocation: string
  characterLocation: string
  mode: PresenceMode
  updatedAt: string
}

type UpdatePresenceFromMovementArgs = {
  characterId: number

  currentCharacterLocation: string

  changesLocation: boolean
  targetLocation: string | null
  leavesCharacter: boolean
  approachesCharacter: boolean
}

const presenceStoragePrefix =
  'velvetverse-presence'

function getPresenceStorageKey(
  characterId: number,
) {
  return `${presenceStoragePrefix}-${characterId}`
}

function createDefaultPresence(
  currentCharacterLocation: string,
): PresenceState {
  return {
    userLocation:
      currentCharacterLocation,

    characterLocation:
      currentCharacterLocation,

    mode:
      'together',

    updatedAt:
      new Date().toISOString(),
  }
}

export function getPresenceState(
  characterId: number,

  currentCharacterLocation: string,
): PresenceState {
  const storageKey =
    getPresenceStorageKey(
      characterId,
    )

  try {
    const saved =
      localStorage.getItem(
        storageKey,
      )

    if (!saved) {
      return createDefaultPresence(
        currentCharacterLocation,
      )
    }

    const parsed =
      JSON.parse(
        saved,
      ) as Partial<PresenceState>

    const userLocation =
      typeof parsed.userLocation ===
        'string' &&
      parsed.userLocation.trim()
        ? parsed.userLocation
        : currentCharacterLocation

    const characterLocation =
      typeof parsed.characterLocation ===
        'string' &&
      parsed.characterLocation.trim()
        ? parsed.characterLocation
        : currentCharacterLocation

    let mode:
      PresenceMode =
        'together'

    if (
      parsed.mode ===
        'together' ||
      parsed.mode ===
        'nearby' ||
      parsed.mode ===
        'separated' ||
      parsed.mode ===
        'remote'
    ) {
      mode =
        parsed.mode
    } else if (
      userLocation !==
      characterLocation
    ) {
      mode =
        'separated'
    }

    return {
      userLocation,

      characterLocation,

      mode,

      updatedAt:
        typeof parsed.updatedAt ===
          'string'
          ? parsed.updatedAt
          : new Date().toISOString(),
    }
  } catch {
    return createDefaultPresence(
      currentCharacterLocation,
    )
  }
}

export function savePresenceState(
  characterId: number,
  state: PresenceState,
) {
  const storageKey =
    getPresenceStorageKey(
      characterId,
    )

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...state,

      updatedAt:
        new Date().toISOString(),
    }),
  )
}

export function updatePresenceFromMovement({
  characterId,
  currentCharacterLocation,
  changesLocation,
  targetLocation,
  leavesCharacter,
  approachesCharacter,
}: UpdatePresenceFromMovementArgs):
PresenceState {
  const current =
    getPresenceState(
      characterId,
      currentCharacterLocation,
    )

  const updated:
    PresenceState = {
      ...current,

      characterLocation:
        currentCharacterLocation,
  }

  if (
    changesLocation &&
    targetLocation
  ) {
    updated.userLocation =
      targetLocation
  }

  if (
    leavesCharacter
  ) {
    updated.mode =
      'separated'
  } else if (
    approachesCharacter
  ) {
    updated.userLocation =
      currentCharacterLocation

    updated.mode =
      'together'
  } else if (
    updated.userLocation ===
    updated.characterLocation
  ) {
    updated.mode =
      'together'
  } else {
    updated.mode =
      'separated'
  }

  savePresenceState(
    characterId,
    updated,
  )

  console.log(
    '[VelvetVerse Presence]',
    {
      before:
        current,

      after:
        updated,
    },
  )

  return updated
}

export function setCharacterPresenceLocation(
  characterId: number,

  characterLocation: string,
) {
  const current =
    getPresenceState(
      characterId,
      characterLocation,
    )

  const updated:
    PresenceState = {
      ...current,

      characterLocation,
  }

  if (
    updated.userLocation ===
    characterLocation
  ) {
    updated.mode =
      'together'
  } else {
    updated.mode =
      'separated'
  }

  savePresenceState(
    characterId,
    updated,
  )

  return updated
}

export function clearPresenceState(
  characterId: number,
) {
  localStorage.removeItem(
    getPresenceStorageKey(
      characterId,
    ),
  )
}