import type {
  RoleplayInterpretation,
} from '../../services/roleplayInterpreterService'

import type {
  PresenceState,
} from '../presenceEngine'

export type PerceptionState = {
  directConversationPossible: boolean

  heardDialogue: string[]

  visibleUserActions: string[]

  visibleObservations: string[]

  privateUserThoughts: string[]

  hiddenNarration: string[]

  blockedClaims: string[]

  characterCanSeeUser: boolean

  characterCanHearUser: boolean

  characterCanTouchUser: boolean

  characterCanBeTouchedByUser: boolean

  summary: string[]
}

type ResolvePerceptionArgs = {
  characterName: string

  interpretation:
    RoleplayInterpretation

  presence:
    PresenceState
}

function isTogether(
  presence:
    PresenceState,
) {
  return (
    presence.mode ===
      'together' ||
    presence.mode ===
      'nearby'
  )
}

function buildBlockedClaims(
  interpretation:
    RoleplayInterpretation,
) {
  return interpretation.claims
    .map(
      (claim) => {
        switch (
          claim.type
        ) {
          case 'character_action':
            return (
              `User attempted to declare ${claim.description}. ` +
              'The character decides their own actions.'
            )

          case 'character_feeling':
            return (
              `User attempted to declare ${claim.description}. ` +
              'The character decides their own feelings.'
            )

          case 'character_thought':
            return (
              `User attempted to declare ${claim.description}. ` +
              'The character decides their own thoughts.'
            )

          case 'character_memory':
            return (
              `User attempted to alter character memory: ${claim.description}. ` +
              'This is not automatically valid.'
            )

          case 'relationship_state':
            return (
              `User attempted to declare a relationship state: ${claim.description}. ` +
              'Relationship state is controlled by the relationship system.'
            )

          case 'world_effect':
            return (
              `User attempted to establish a world effect: ${claim.description}. ` +
              'The effect is unverified and must not automatically become true.'
            )

          default:
            return (
              `User made an unverified claim: ${claim.description}.`
            )
        }
      },
    )
}

export function resolvePerception({
  characterName,
  interpretation,
  presence,
}: ResolvePerceptionArgs):
PerceptionState {
  const together =
    isTogether(
      presence,
    )

  /*
   * Spoken dialogue can only be heard
   * naturally while the user and character
   * are together or nearby.
   *
   * Later we can add remote communication
   * such as calls, letters, magic, etc.
   */

  const heardDialogue =
    together
      ? [
          ...interpretation.spokenDialogue,
        ]
      : []

  /*
   * Physical user actions are only visible
   * when they occur in the character's
   * presence.
   */

  const visibleUserActions =
    together
      ? [
          ...interpretation.userActions,
        ]
      : []

  /*
   * User observations belong to the user.
   *
   * The character does not automatically
   * know what the user noticed.
   */

  const visibleObservations:
    string[] = []

  /*
   * User thoughts always remain private
   * unless a separate established mechanic
   * explicitly allows thought-reading.
   */

  const privateUserThoughts = [
    ...interpretation.userThoughts,
  ]

  /*
   * General narration that occurs while
   * separated should not automatically
   * become character knowledge.
   */

  const hiddenNarration =
    together
      ? []
      : [
          ...interpretation.narration,
        ]

  const blockedClaims =
    buildBlockedClaims(
      interpretation,
    )

  const characterCanSeeUser =
    together

  const characterCanHearUser =
    together

  const characterCanTouchUser =
    together

  const characterCanBeTouchedByUser =
    together

  const directConversationPossible =
    together

  const summary:
    string[] = []

  if (
    directConversationPossible
  ) {
    summary.push(
      `${characterName} and the user are physically together or close enough for normal interaction.`,
    )
  } else {
    summary.push(
      `${characterName} and the user are physically separated.`,
    )

    summary.push(
      `${characterName} cannot directly see, hear, touch, or respond to the user's private activity from the current location.`,
    )
  }

  if (
    privateUserThoughts.length > 0
  ) {
    summary.push(
      'The user has private thoughts that the character does not know.',
    )
  }

  if (
    blockedClaims.length > 0
  ) {
    summary.push(
      'The user made one or more claims about the character or world that are not automatically authoritative.',
    )
  }

  if (
    heardDialogue.length > 0
  ) {
    summary.push(
      `${characterName} can hear spoken dialogue from the user.`,
    )
  }

  if (
    visibleUserActions.length > 0
  ) {
    summary.push(
      `${characterName} can observe the user's visible physical actions.`,
    )
  }

  return {
    directConversationPossible,

    heardDialogue,

    visibleUserActions,

    visibleObservations,

    privateUserThoughts,

    hiddenNarration,

    blockedClaims,

    characterCanSeeUser,

    characterCanHearUser,

    characterCanTouchUser,

    characterCanBeTouchedByUser,

    summary,
  }
}