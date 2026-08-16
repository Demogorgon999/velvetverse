export type RelationshipState = {
  trust: number
  affection: number
  attraction: number
  respect: number
  comfort: number
  irritation: number
  caution: number
  interactionCount: number
  updatedAt: string
}

export type RelationshipDimension =
  | 'trust'
  | 'affection'
  | 'attraction'
  | 'respect'
  | 'comfort'
  | 'irritation'
  | 'caution'

export type RelationshipChanges = {
  trust?: number
  affection?: number
  attraction?: number
  respect?: number
  comfort?: number
  irritation?: number
  caution?: number
}

export type SocialRelationshipStage =
  | 'Hostile'
  | 'Stranger'
  | 'Acquaintance'
  | 'Friend'
  | 'Close Friend'
  | 'Trusted'
  | 'Best Friend'

export type RomanticRelationshipStage =
  | 'None'
  | 'Curious'
  | 'Attracted'
  | 'Crush'
  | 'Strong Feelings'
  | 'In Love'

export type RelationshipInterpretation = {
  socialStage:
    SocialRelationshipStage

  romanticStage:
    RomanticRelationshipStage

  closeness: number

  positiveFeeling: number

  tension: number
}

const relationshipStoragePrefix =
  'velvetverse-relationship'

function clampRelationshipValue(
  value: number,
) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value),
    ),
  )
}

export function createDefaultRelationship():
  RelationshipState {
  return {
    trust: 5,
    affection: 0,
    attraction: 0,
    respect: 5,
    comfort: 2,

    irritation: 0,
    caution: 20,

    interactionCount: 0,

    updatedAt:
      new Date().toISOString(),
  }
}

function getRelationshipStorageKey(
  characterId: number,
) {
  return `${relationshipStoragePrefix}-${characterId}`
}

export function getCharacterRelationship(
  characterId: number,
): RelationshipState {
  const storageKey =
    getRelationshipStorageKey(
      characterId,
    )

  try {
    const savedRelationship =
      localStorage.getItem(
        storageKey,
      )

    if (!savedRelationship) {
      return createDefaultRelationship()
    }

    const parsed =
      JSON.parse(
        savedRelationship,
      ) as Partial<RelationshipState>

    const defaults =
      createDefaultRelationship()

    return {
      trust:
        typeof parsed.trust ===
        'number'
          ? clampRelationshipValue(
              parsed.trust,
            )
          : defaults.trust,

      affection:
        typeof parsed.affection ===
        'number'
          ? clampRelationshipValue(
              parsed.affection,
            )
          : defaults.affection,

      attraction:
        typeof parsed.attraction ===
        'number'
          ? clampRelationshipValue(
              parsed.attraction,
            )
          : defaults.attraction,

      respect:
        typeof parsed.respect ===
        'number'
          ? clampRelationshipValue(
              parsed.respect,
            )
          : defaults.respect,

      comfort:
        typeof parsed.comfort ===
        'number'
          ? clampRelationshipValue(
              parsed.comfort,
            )
          : defaults.comfort,

      irritation:
        typeof parsed.irritation ===
        'number'
          ? clampRelationshipValue(
              parsed.irritation,
            )
          : defaults.irritation,

      caution:
        typeof parsed.caution ===
        'number'
          ? clampRelationshipValue(
              parsed.caution,
            )
          : defaults.caution,

      interactionCount:
        typeof parsed.interactionCount ===
        'number'
          ? Math.max(
              0,
              Math.round(
                parsed.interactionCount,
              ),
            )
          : 0,

      updatedAt:
        typeof parsed.updatedAt ===
        'string'
          ? parsed.updatedAt
          : defaults.updatedAt,
    }
  } catch {
    return createDefaultRelationship()
  }
}

export function saveCharacterRelationship(
  characterId: number,
  relationship:
    RelationshipState,
) {
  const storageKey =
    getRelationshipStorageKey(
      characterId,
    )

  const normalised:
    RelationshipState = {
    trust:
      clampRelationshipValue(
        relationship.trust,
      ),

    affection:
      clampRelationshipValue(
        relationship.affection,
      ),

    attraction:
      clampRelationshipValue(
        relationship.attraction,
      ),

    respect:
      clampRelationshipValue(
        relationship.respect,
      ),

    comfort:
      clampRelationshipValue(
        relationship.comfort,
      ),

    irritation:
      clampRelationshipValue(
        relationship.irritation,
      ),

    caution:
      clampRelationshipValue(
        relationship.caution,
      ),

    interactionCount:
      Math.max(
        0,
        Math.round(
          relationship.interactionCount,
        ),
      ),

    updatedAt:
      new Date().toISOString(),
  }

  localStorage.setItem(
    storageKey,
    JSON.stringify(
      normalised,
    ),
  )
}

export function applyRelationshipChanges(
  characterId: number,
  changes:
    RelationshipChanges,
): RelationshipState {
  const current =
    getCharacterRelationship(
      characterId,
    )

  const updated:
    RelationshipState = {
    ...current,

    trust:
      clampRelationshipValue(
        current.trust +
        (changes.trust ?? 0),
      ),

    affection:
      clampRelationshipValue(
        current.affection +
        (changes.affection ?? 0),
      ),

    attraction:
      clampRelationshipValue(
        current.attraction +
        (changes.attraction ?? 0),
      ),

    respect:
      clampRelationshipValue(
        current.respect +
        (changes.respect ?? 0),
      ),

    comfort:
      clampRelationshipValue(
        current.comfort +
        (changes.comfort ?? 0),
      ),

    irritation:
      clampRelationshipValue(
        current.irritation +
        (changes.irritation ?? 0),
      ),

    caution:
      clampRelationshipValue(
        current.caution +
        (changes.caution ?? 0),
      ),

    interactionCount:
      current.interactionCount + 1,

    updatedAt:
      new Date().toISOString(),
  }

  saveCharacterRelationship(
    characterId,
    updated,
  )

  return updated
}

export function interpretRelationship(
  relationship:
    RelationshipState,
): RelationshipInterpretation {
  /*
   * Social closeness should primarily
   * come from trust, respect and
   * comfort.
   *
   * Affection contributes, but
   * attraction alone cannot make
   * somebody a trusted friend.
   */

  const closeness =
    clampRelationshipValue(
      (
        relationship.trust *
          0.35 +
        relationship.respect *
          0.25 +
        relationship.comfort *
          0.25 +
        relationship.affection *
          0.15
      ),
    )

  /*
   * Romantic feeling is deliberately
   * separate from friendship.
   *
   * Attraction matters strongly, but
   * affection and trust are required
   * for deeper romantic states.
   */

  const positiveFeeling =
    clampRelationshipValue(
      (
        relationship.attraction *
          0.4 +
        relationship.affection *
          0.35 +
        relationship.trust *
          0.15 +
        relationship.comfort *
          0.1
      ),
    )

  /*
   * Irritation and caution create
   * relationship tension.
   */

  const tension =
    clampRelationshipValue(
      (
        relationship.irritation *
          0.6 +
        relationship.caution *
          0.4
      ),
    )

  let socialStage:
    SocialRelationshipStage =
      'Stranger'

  if (
    relationship.irritation >=
      70 &&
    relationship.trust <= 15
  ) {
    socialStage =
      'Hostile'
  } else if (
    closeness >= 80 &&
    relationship.trust >= 75
  ) {
    socialStage =
      'Best Friend'
  } else if (
    closeness >= 65 &&
    relationship.trust >= 60
  ) {
    socialStage =
      'Trusted'
  } else if (
    closeness >= 50
  ) {
    socialStage =
      'Close Friend'
  } else if (
    closeness >= 35
  ) {
    socialStage =
      'Friend'
  } else if (
    closeness >= 15
  ) {
    socialStage =
      'Acquaintance'
  }

  let romanticStage:
    RomanticRelationshipStage =
      'None'

  /*
   * A character cannot simply be
   * compliment-spammed into love.
   *
   * Deeper romantic states require
   * attraction AND emotional bonds.
   */

  if (
    relationship.attraction >= 85 &&
    relationship.affection >= 80 &&
    relationship.trust >= 70 &&
    relationship.comfort >= 65
  ) {
    romanticStage =
      'In Love'
  } else if (
    relationship.attraction >= 70 &&
    relationship.affection >= 60 &&
    relationship.trust >= 50
  ) {
    romanticStage =
      'Strong Feelings'
  } else if (
    relationship.attraction >= 55 &&
    relationship.affection >= 40 &&
    relationship.trust >= 30
  ) {
    romanticStage =
      'Crush'
  } else if (
    relationship.attraction >= 35 &&
    relationship.affection >= 20
  ) {
    romanticStage =
      'Attracted'
  } else if (
    relationship.attraction >= 15
  ) {
    romanticStage =
      'Curious'
  }

  return {
    socialStage,
    romanticStage,
    closeness,
    positiveFeeling,
    tension,
  }
}

export function clearCharacterRelationship(
  characterId: number,
) {
  localStorage.removeItem(
    getRelationshipStorageKey(
      characterId,
    ),
  )
}