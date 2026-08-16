export type SceneEventType =
  | 'character_action'
  | 'environment'
  | 'npc'
  | 'story_echo'

export type SceneEventVisibility =
  | 'ambient'
  | 'observable'
  | 'interrupting'

export type SceneEvent = {
  type:
    SceneEventType

  visibility:
    SceneEventVisibility

  description:
    string

  instruction:
    string
}

type SceneEngineArgs = {
  characterName:
    string

  currentLocation:
    string

  currentActivity:
    string

  mood:
    string

  relationshipStage:
    string

  activeStoryTitle?:
    string

  activeStoryDescription?:
    string
}

type WeightedSceneEvent = {
  weight:
    number

  event:
    SceneEvent
}

const sceneCooldowns =
  new Map<string, number>()

const messageCounters =
  new Map<string, number>()

function chooseWeightedEvent(
  events:
    WeightedSceneEvent[],
): SceneEvent | null {
  const totalWeight =
    events.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.weight,
      0,
    )

  if (
    totalWeight <= 0
  ) {
    return null
  }

  let roll =
    Math.random() *
    totalWeight

  for (
    const item of
    events
  ) {
    roll -=
      item.weight

    if (
      roll <= 0
    ) {
      return item.event
    }
  }

  return (
    events[
      events.length - 1
    ]?.event ??
    null
  )
}

function getCharacterActions(
  args:
    SceneEngineArgs,
): WeightedSceneEvent[] {
  const events:
    WeightedSceneEvent[] = []

  /*
   * ================================================================
   * GENERAL AUTONOMOUS ACTIONS
   * ================================================================
   */

  events.push(
    {
      weight: 4,

      event: {
        type:
          'character_action',

        visibility:
          'observable',

        description:
          `${args.characterName} shifts position and briefly studies the surroundings.`,

        instruction:
          'This physical action must be visible in the response, but it should remain brief and natural.',
      },
    },

    {
      weight: 3,

      event: {
        type:
          'character_action',

        visibility:
          'observable',

        description:
          `${args.characterName} rises and moves a short distance away before continuing the conversation.`,

        instruction:
          'The character independently chose to move. Show the movement naturally and let the current mood influence how it happens.',
      },
    },

    {
      weight: 3,

      event: {
        type:
          'character_action',

        visibility:
          'observable',

        description:
          `${args.characterName} pauses what they are doing and turns their attention toward something in the room.`,

        instruction:
          'The pause and shift of attention must appear briefly in the response before the conversation continues.',
      },
    },
  )

  /*
   * ================================================================
   * MOOD-SENSITIVE ACTIONS
   * ================================================================
   */

  if (
    args.mood ===
      'Irritated' ||
    args.mood ===
      'Suspicious'
  ) {
    events.push({
      weight: 6,

      event: {
        type:
          'character_action',

        visibility:
          'observable',

        description:
          `${args.characterName} rises and begins pacing slowly.`,

        instruction:
          'Show the pacing clearly. The movement should reflect restrained tension, irritation, or suspicion.',
      },
    })
  }

  if (
    args.mood ===
    'Sad'
  ) {
    events.push({
      weight: 5,

      event: {
        type:
          'character_action',

        visibility:
          'observable',

        description:
          `${args.characterName} grows quiet and looks away for a moment.`,

        instruction:
          'Show this quiet physical pause clearly without turning it into melodrama.',
      },
    })
  }

  if (
    args.mood ===
    'Affectionate'
  ) {
    events.push({
      weight: 4,

      event: {
        type:
          'character_action',

        visibility:
          'observable',

        description:
          `${args.characterName} relaxes slightly and remains physically closer than before.`,

        instruction:
          'Make the change in physical comfort visible, but do not force romance beyond the current relationship state.',
      },
    })
  }

  return events
}

function getEnvironmentalEvents(
  args:
    SceneEngineArgs,
): WeightedSceneEvent[] {
  return [
    {
      weight: 4,

      event: {
        type:
          'environment',

        visibility:
          'ambient',

        description:
          `A faint sound carries through ${args.currentLocation}.`,

        instruction:
          'This is minor background atmosphere. The character may acknowledge it or ignore it if the conversation matters more.',
      },
    },

    {
      weight: 3,

      event: {
        type:
          'environment',

        visibility:
          'ambient',

        description:
          'Movement can briefly be heard somewhere beyond the immediate conversation area.',

        instruction:
          'Treat this as ordinary background activity unless the character has a reason to notice it.',
      },
    },

    {
      weight: 2,

      event: {
        type:
          'environment',

        visibility:
          'observable',

        description:
          `Something in the surrounding environment briefly draws ${args.characterName}'s attention.`,

        instruction:
          'The shift in attention must be visible briefly before the character returns attention to the user.',
      },
    },
  ]
}

function getNpcEvents(
  args:
    SceneEngineArgs,
): WeightedSceneEvent[] {
  return [
    {
      weight: 3,

      event: {
        type:
          'npc',

        visibility:
          'observable',

        description:
          `Someone approaches the area but waits rather than immediately interrupting ${args.characterName}.`,

        instruction:
          'The approaching person must visibly enter the scene. Treat them as a minor NPC appropriate to the location. Do not invent major story information.',
      },
    },

    {
      weight: 2,

      event: {
        type:
          'npc',

        visibility:
          'interrupting',

        description:
          'A brief knock or equivalent request for attention interrupts the surroundings.',

        instruction:
          'This interruption must visibly occur. The character may acknowledge, dismiss, ignore, delay, or respond to whoever seeks attention according to personality and mood.',
      },
    },
  ]
}

function getStoryEchoEvents(
  args:
    SceneEngineArgs,
): WeightedSceneEvent[] {
  if (
    !args.activeStoryTitle ||
    !args.activeStoryDescription
  ) {
    return []
  }

  return [
    {
      weight: 2,

      event: {
        type:
          'story_echo',

        visibility:
          'observable',

        description:
          `Something nearby briefly reminds ${args.characterName} of the unresolved situation: ${args.activeStoryTitle}.`,

        instruction:
          'The reminder must subtly appear in the character reaction, but it must not resolve the active story or invent major new facts.',
      },
    },
  ]
}

export function maybeCreateSceneEvent(
  args:
    SceneEngineArgs,
): SceneEvent | null {
  const key =
    args.characterName

  const messageCount =
    (
      messageCounters.get(
        key,
      ) ?? 0
    ) + 1

  messageCounters.set(
    key,
    messageCount,
  )

  /*
   * ================================================================
   * INITIAL DELAY
   * ================================================================
   *
   * Let the conversation establish itself
   * before autonomous scene activity begins.
   */

  if (
    messageCount < 3
  ) {
    return null
  }

  /*
   * ================================================================
   * COOLDOWN
   * ================================================================
   */

  const cooldown =
    sceneCooldowns.get(
      key,
    ) ?? 0

  if (
    cooldown > 0
  ) {
    sceneCooldowns.set(
      key,
      cooldown - 1,
    )

    return null
  }

  /*
   * ================================================================
   * EVENT CHANCE
   * ================================================================
   */

  let eventChance =
    0.18

  /*
   * Emotionally active moods slightly
   * increase autonomous scene behaviour.
   */

  if (
    args.mood ===
      'Irritated' ||
    args.mood ===
      'Suspicious' ||
    args.mood ===
      'Sad' ||
    args.mood ===
      'Affectionate'
  ) {
    eventChance +=
      0.07
  }

  /*
   * Active stories make the surrounding
   * world slightly more active.
   */

  if (
    args.activeStoryTitle
  ) {
    eventChance +=
      0.05
  }

  if (
    Math.random() >
    eventChance
  ) {
    return null
  }

  /*
   * ================================================================
   * EVENT POOL
   * ================================================================
   */

  const possibleEvents = [
    ...getCharacterActions(
      args,
    ),

    ...getEnvironmentalEvents(
      args,
    ),

    ...getNpcEvents(
      args,
    ),

    ...getStoryEchoEvents(
      args,
    ),
  ]

  const event =
    chooseWeightedEvent(
      possibleEvents,
    )

  if (!event) {
    return null
  }

  /*
   * ================================================================
   * POST-EVENT COOLDOWN
   * ================================================================
   *
   * Avoid making the world feel like
   * random events are firing constantly.
   */

  const cooldownMessages =
    2 +
    Math.floor(
      Math.random() * 3,
    )

  sceneCooldowns.set(
    key,
    cooldownMessages,
  )

  return event
}