export type LifePriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'critical'

export type CharacterActivity =
  | 'sleeping'
  | 'studying'
  | 'travelling'
  | 'training'
  | 'working'
  | 'exploring'
  | 'waiting'
  | 'socialising'
  | 'investigating'
  | 'celebrating'
  | 'resting'

export type LifeEvent = {
  id: string
  title: string
  description: string
  priority: LifePriority
  createdAt: number

  discussed: boolean
}

export type LifeState = {
  characterId: number
  lastSeen: number
  lastSimulatedAt: number
  currentActivity: CharacterActivity
  currentGoal: string
  currentLocation: string
  currentEvent?: LifeEvent
  returnHook?: string
  needsAttention: boolean
}

type LifeScenario = {
  activity: CharacterActivity
  location: string
  goal: string
  title: string
  description: string
  priority: LifePriority
}

const lifeStoragePrefix =
  'velvetverse-life'

const characterLifeScenarios:
  Record<number, LifeScenario[]> = {
  1: [
    {
      activity: 'studying',
      location: 'The Royal Library',
      goal:
        'Understand an ancient prophecy hidden within the castle archives.',
      title: 'An Ancient Discovery',
      description:
        'Lady Seraphina uncovered a sealed manuscript in the Royal Library and has been waiting to discuss what it contains.',
      priority: 'normal',
    },
    {
      activity: 'socialising',
      location: 'The Vampire Council',
      goal:
        'Protect her influence among the ancient houses.',
      title: 'The Council Has Met',
      description:
        'The Vampire Council gathered while you were away. Lady Seraphina heard something there that she believes you should know.',
      priority: 'high',
    },
    {
      activity: 'investigating',
      location: 'Beneath Castle Noctis',
      goal:
        'Discover who has been entering the forgotten chambers below the castle.',
      title: 'Something Beneath the Castle',
      description:
        'Lady Seraphina discovered signs that someone has entered chambers beneath Castle Noctis that have been sealed for centuries.',
      priority: 'high',
    },
    {
      activity: 'waiting',
      location: 'The Throne Room',
      goal:
        'Decide how much she is willing to reveal to you.',
      title: 'She Has Been Waiting',
      description:
        'Lady Seraphina has had time to think about your last conversations and there is something she now wants to ask you.',
      priority: 'normal',
    },
  ],

  2: [
    {
      activity: 'exploring',
      location: 'The Enchanted Forest',
      goal:
        'Protect the ancient paths surrounding her kingdom.',
      title: 'A Strange Path Appeared',
      description:
        'Lyra discovered a path in the forest that she does not remember seeing before, and it seems to react to magic.',
      priority: 'normal',
    },
    {
      activity: 'studying',
      location: 'The Moonvale Archives',
      goal:
        'Understand a forgotten piece of elven history.',
      title: 'A Forgotten Song',
      description:
        'Lyra found an ancient elven song whose final verse appears to have been deliberately removed.',
      priority: 'normal',
    },
    {
      activity: 'travelling',
      location: 'The Northern Glades',
      goal:
        'Investigate disturbances among the forest creatures.',
      title: 'The Forest Is Changing',
      description:
        'Lyra travelled beyond the familiar borders of her kingdom after the forest creatures began behaving strangely.',
      priority: 'high',
    },
    {
      activity: 'waiting',
      location: 'Moonvale Palace',
      goal:
        'Share something personal with you.',
      title: 'Lyra Has Something For You',
      description:
        'Lyra has kept something aside since your last visit and has been hoping you would return.',
      priority: 'normal',
    },
  ],

  3: [
    {
      activity: 'investigating',
      location: 'Neo Tokyo',
      goal:
        'Solve a case that appears to have been erased from official records.',
      title: 'A New Lead',
      description:
        'Nova-7 uncovered a data trail connected to a case that someone powerful appears determined to erase.',
      priority: 'high',
    },
    {
      activity: 'working',
      location:
        'Nova-7 Investigation Office',
      goal:
        'Decrypt a mysterious data fragment.',
      title: 'Decryption Complete',
      description:
        'Nova-7 finally decrypted part of the data she has been analysing and wants your opinion on what it reveals.',
      priority: 'normal',
    },
    {
      activity: 'travelling',
      location: 'The Lower City',
      goal:
        'Track an unidentified surveillance signal.',
      title: 'Someone Is Watching',
      description:
        'Nova-7 traced an unusual surveillance signal into the Lower City. She suspects someone has been following her movements.',
      priority: 'high',
    },
    {
      activity: 'waiting',
      location: 'The Neon District',
      goal:
        'Decide whether you can be trusted with sensitive information.',
      title: 'Nova Needs Your Opinion',
      description:
        'Nova-7 has reached a point in her investigation where she wants an outside perspective—and she chose yours.',
      priority: 'normal',
    },
  ],

  4: [
    {
      activity: 'training',
      location:
        'The Black Legion Courtyard',
      goal:
        'Prepare his soldiers for the battles ahead.',
      title: 'The Legion Is Preparing',
      description:
        'Kael has spent hours training the Black Legion after receiving troubling reports from the frontier.',
      priority: 'normal',
    },
    {
      activity: 'travelling',
      location: 'The Ashmoor Frontier',
      goal:
        'Investigate reports of movement beyond the northern border.',
      title: 'Trouble on the Frontier',
      description:
        'Kael rode north after scouts reported movement near the Ashmoor border. What he found has left him uneasy.',
      priority: 'high',
    },
    {
      activity: 'working',
      location: 'The War Room',
      goal:
        'Prevent another battle like Grey Hollow.',
      title: 'A Difficult Decision',
      description:
        'Kael has been studying maps and casualty reports. He must make a decision and would value someone he trusts challenging his judgment.',
      priority: 'high',
    },
    {
      activity: 'resting',
      location:
        'The Black Legion Camp',
      goal:
        'Find a moment of peace before his next duty.',
      title: 'A Quiet Evening',
      description:
        'For once, Kael has allowed himself a quiet evening beside the fire. He seems more willing to talk than usual.',
      priority: 'low',
    },
  ],

  5: [
    {
      activity: 'investigating',
      location: 'Black Hollow',
      goal:
        'Identify the source of a supernatural disturbance.',
      title: 'Another Impossible Case',
      description:
        'Selene found evidence at a crime scene that should not exist according to any ordinary explanation.',
      priority: 'high',
    },
    {
      activity: 'studying',
      location:
        'The Ashcroft Archives',
      goal:
        'Translate a forbidden occult journal.',
      title: 'A Dangerous Translation',
      description:
        'Selene translated another page of an Ashcroft journal and discovered a warning written specifically for members of her family.',
      priority: 'normal',
    },
    {
      activity: 'travelling',
      location: 'Victorian London',
      goal:
        'Follow a trail connecting several supernatural incidents.',
      title: 'The Cases Are Connected',
      description:
        'Selene realised that several seemingly unrelated supernatural cases share the same mysterious symbol.',
      priority: 'high',
    },
    {
      activity: 'waiting',
      location: 'The Ashcroft Study',
      goal:
        'Decide whether to involve you in her investigation.',
      title: 'Selene Needs Another Mind',
      description:
        'Selene has been staring at the same evidence for hours. She believes you may notice something she has missed.',
      priority: 'normal',
    },
  ],

  6: [
    {
      activity: 'working',
      location: 'The Ice Court',
      goal:
        'Protect Frosthaven from political instability.',
      title: 'The Court Is Divided',
      description:
        'Valeria spent the day dealing with a dispute among the northern houses that threatens the stability of Frosthaven.',
      priority: 'high',
    },
    {
      activity: 'studying',
      location:
        'The Frosthaven Archives',
      goal:
        'Understand an old treaty before making her next decision.',
      title: 'An Old Treaty',
      description:
        'Valeria discovered a forgotten clause in an ancient treaty that may change everything about the current dispute.',
      priority: 'normal',
    },
    {
      activity: 'travelling',
      location: 'The Frozen Pass',
      goal:
        'Inspect the kingdom borders personally.',
      title: 'Beyond the Frozen Pass',
      description:
        'Valeria travelled to the Frozen Pass after patrols reported something unusual beyond the kingdom border.',
      priority: 'high',
    },
    {
      activity: 'resting',
      location:
        'Her Private Chambers',
      goal:
        'Consider whether duty has begun to cost too much.',
      title: 'A Rare Quiet Moment',
      description:
        'Valeria has finally stepped away from court for the evening. She seems unusually thoughtful.',
      priority: 'low',
    },
  ],

  7: [
    {
      activity: 'training',
      location: 'Stonepeak',
      goal:
        'Keep the northern clans prepared for war.',
      title: 'The Warriors Gather',
      description:
        'Ragnar spent the day training alongside his warriors after troubling news arrived from the eastern clans.',
      priority: 'normal',
    },
    {
      activity: 'socialising',
      location: 'The Great Hall',
      goal:
        'Keep the northern clans united.',
      title:
        'The Clan Chiefs Have Spoken',
      description:
        'Ragnar called the clan chiefs together. The feast began peacefully, but the council that followed did not.',
      priority: 'high',
    },
    {
      activity: 'travelling',
      location: 'The Great Fjords',
      goal:
        'Investigate reports from villages along the coast.',
      title:
        'Something Came From the Sea',
      description:
        'Ragnar travelled to a coastal settlement after fishermen reported seeing unfamiliar ships beyond the fjords.',
      priority: 'high',
    },
    {
      activity: 'resting',
      location:
        'Stonepeak Great Hall',
      goal:
        'Remember why peace is worth fighting for.',
      title: 'Stories by the Fire',
      description:
        'Ragnar is sitting beside the fire listening to old warriors tell stories. There is an empty seat beside him.',
      priority: 'low',
    },
  ],
}

const fallbackScenarios:
  LifeScenario[] = [
    {
      activity: 'working',
      location: 'Home',
      goal:
        'Continue pursuing their current goals.',
      title: 'Life Continued',
      description:
        'Something happened while you were away, and the character has been waiting to tell you about it.',
      priority: 'normal',
    },

    {
      activity: 'exploring',
      location: 'Nearby',
      goal:
        'Discover something new.',
      title: 'A New Discovery',
      description:
        'The character discovered something unexpected while you were away.',
      priority: 'normal',
    },
  ]

function getScenarioPool(
  characterId: number,
) {
  return (
    characterLifeScenarios[
      characterId
    ] ?? fallbackScenarios
  )
}

function chooseScenario(
  characterId: number,
  lastSeen: number,
) {
  const scenarios =
    getScenarioPool(characterId)

  const dayNumber =
    Math.floor(
      lastSeen /
        (1000 * 60 * 60 * 24),
    )

  const index =
    Math.abs(
      dayNumber + characterId,
    ) % scenarios.length

  return scenarios[index]
}

function getLifeStorageKey(
  characterId: number,
) {
  return `${lifeStoragePrefix}-${characterId}`
}

export function createDefaultLifeState(
  characterId: number,
): LifeState {
  const now = Date.now()

  return {
    characterId,

    lastSeen: now,

    lastSimulatedAt: now,

    currentActivity: 'waiting',

    currentGoal:
      'Continue building a meaningful connection with the user.',

    currentLocation: 'Home',

    needsAttention: false,
  }
}

function normaliseLifeState(
  characterId: number,
  savedState: Partial<LifeState>,
): LifeState {
  const fallback =
    createDefaultLifeState(
      characterId,
    )

  return {
    characterId,

    lastSeen:
      typeof savedState.lastSeen ===
      'number'
        ? savedState.lastSeen
        : fallback.lastSeen,

    lastSimulatedAt:
      typeof savedState.lastSimulatedAt ===
      'number'
        ? savedState.lastSimulatedAt
        : fallback.lastSimulatedAt,

    currentActivity:
      typeof savedState.currentActivity ===
      'string'
        ? savedState.currentActivity
        : fallback.currentActivity,

    currentGoal:
      typeof savedState.currentGoal ===
      'string'
        ? savedState.currentGoal
        : fallback.currentGoal,

    currentLocation:
      typeof savedState.currentLocation ===
      'string'
        ? savedState.currentLocation
        : fallback.currentLocation,

    currentEvent:
      savedState.currentEvent,

    returnHook:
      typeof savedState.returnHook ===
      'string'
        ? savedState.returnHook
        : undefined,

    needsAttention:
      typeof savedState.needsAttention ===
      'boolean'
        ? savedState.needsAttention
        : false,
  }
}

export function saveLifeState(
  state: LifeState,
) {
  localStorage.setItem(
    getLifeStorageKey(
      state.characterId,
    ),
    JSON.stringify(state),
  )
}

export function getLifeState(
  characterId: number,
): LifeState {
  try {
    const savedState =
      localStorage.getItem(
        getLifeStorageKey(
          characterId,
        ),
      )

    if (!savedState) {
      const defaultState =
        createDefaultLifeState(
          characterId,
        )

      saveLifeState(defaultState)

      return defaultState
    }

    const parsedState =
      JSON.parse(
        savedState,
      ) as Partial<LifeState>

    return normaliseLifeState(
      characterId,
      parsedState,
    )
  } catch {
    const defaultState =
      createDefaultLifeState(
        characterId,
      )

    saveLifeState(defaultState)

    return defaultState
  }
}

export function setLifeActivity(
  characterId: number,
  activity: CharacterActivity,
  location?: string,
) {
  const state =
    getLifeState(characterId)

  const updatedState: LifeState = {
    ...state,

    currentActivity:
      activity,

    currentLocation:
      location ??
      state.currentLocation,

    lastSimulatedAt:
      Date.now(),
  }

  saveLifeState(updatedState)

  return updatedState
}

export function setLifeGoal(
  characterId: number,
  goal: string,
) {
  const state =
    getLifeState(characterId)

  const updatedState: LifeState = {
    ...state,

    currentGoal:
      goal.trim() ||
      state.currentGoal,

    lastSimulatedAt:
      Date.now(),
  }

  saveLifeState(updatedState)

  return updatedState
}

export function createLifeEvent(
  characterId: number,
  title: string,
  description: string,
  priority: LifePriority = 'normal',
) {
  const state =
    getLifeState(characterId)

  const event: LifeEvent = {
    id:
      `${characterId}-${Date.now()}`,

    title,

    description,

    priority,

    createdAt:
    
      Date.now(),
    discussed: false,
  }

  const updatedState: LifeState = {
    ...state,

    currentEvent: event,

    returnHook: description,

    needsAttention:
      priority === 'high' ||
      priority === 'critical',

    lastSimulatedAt:
      Date.now(),
  }

  saveLifeState(updatedState)

  return updatedState
}

export function clearLifeEvent(
  characterId: number,
) {
  const state =
    getLifeState(characterId)

  const updatedState: LifeState = {
    ...state,

    currentEvent:
      undefined,

    returnHook:
      undefined,

    needsAttention:
      false,

    lastSimulatedAt:
      Date.now(),
  }

  saveLifeState(updatedState)

  return updatedState
}

export function getHoursSinceLastSeen(
  characterId: number,
) {
  const state =
    getLifeState(characterId)

  return Math.max(
    0,
    Math.floor(
      (
        Date.now() -
        state.lastSeen
      ) /
        (1000 * 60 * 60),
    ),
  )
}

export function simulateLifeSinceLastSeen(
  characterId: number,
): LifeState {
  const state =
    getLifeState(characterId)

  const now =
    Date.now()

  const hoursAway =
    (
      now -
      state.lastSeen
    ) /
    (1000 * 60 * 60)

  if (hoursAway < 2) {
    const updatedState:
      LifeState = {
      ...state,

      lastSimulatedAt:
        now,
    }

    saveLifeState(updatedState)

    return updatedState
  }

  const hoursSinceSimulation =
    (
      now -
      state.lastSimulatedAt
    ) /
    (1000 * 60 * 60)

  if (
    state.currentEvent &&
    hoursSinceSimulation < 6
  ) {
    return state
  }

  const scenario =
    chooseScenario(
      characterId,
      state.lastSeen,
    )

  let priority =
    scenario.priority

  if (
    hoursAway >= 72 &&
    priority === 'normal'
  ) {
    priority = 'high'
  }

 const event: LifeEvent = {
  id:
    `${characterId}-${now}`,

  title:
    scenario.title,

  description:
    scenario.description,

  priority,

  createdAt:
    now,

  discussed: false,
}

  const updatedState:
    LifeState = {
    ...state,

    currentActivity:
      scenario.activity,

    currentLocation:
      scenario.location,

    currentGoal:
      scenario.goal,

    currentEvent:
      event,

    returnHook:
      scenario.description,

    needsAttention:
      priority === 'high' ||
      priority === 'critical',

    lastSimulatedAt:
      now,
  }

  saveLifeState(updatedState)

  return updatedState
}

export function updateLastSeen(
  characterId: number,
) {
  const state =
    getLifeState(characterId)

  const updatedState: LifeState = {
    ...state,

    lastSeen:
      Date.now(),
  }

  saveLifeState(updatedState)

  return updatedState
}

export function markCharacterSeen(
  characterId: number,
) {
  const state =
    getLifeState(characterId)

  const updatedState: LifeState = {
    ...state,

    lastSeen:
      Date.now(),

    needsAttention:
      false,
  }

  saveLifeState(updatedState)

  return updatedState
}
export function debugSetHoursAway(
  characterId: number,
  hoursAway: number,
) {
  const state =
    getLifeState(characterId)

  const updatedState: LifeState = {
    ...state,

    lastSeen:
      Date.now() -
      hoursAway *
        60 *
        60 *
        1000,

    lastSimulatedAt:
      Date.now() -
      hoursAway *
        60 *
        60 *
        1000,

    currentEvent:
      undefined,

    returnHook:
      undefined,

    needsAttention:
      false,
  }

  saveLifeState(updatedState)

  return updatedState
}export function hasPendingLifeEvent(
  characterId: number,
): boolean {
  const state =
    getLifeState(characterId)

  return Boolean(
    state.currentEvent &&
      !state.currentEvent.discussed,
  )
}

export function markLifeEventDiscussed(
  characterId: number,
) {
  const state =
    getLifeState(characterId)

  if (!state.currentEvent) {
    return
  }

  state.currentEvent = {
    ...state.currentEvent,
    discussed: true,
  }

  saveLifeState(state)
}
export function clearLifeState(
  characterId: number,
) {
  localStorage.removeItem(
    getLifeStorageKey(
      characterId,
    ),
  )
}