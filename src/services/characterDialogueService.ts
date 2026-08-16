import type {
  ChemistryEvaluation,
} from '../utils/chemistryEngine'

import type {
  ReplyHandlerArgs,
} from '../utils/replies/types'

import type {
  PresenceState,
} from '../utils/presenceEngine'

import type {
  PerceptionState,
} from '../utils/intent/perceptionEngine'

import type {
  RoleplayInterpretation,
} from './roleplayInterpreterService'

import {
  buildCharacterPrompt,
} from './promptBuilder'

import {
  getLifeState,
} from '../utils/lifeEngine'

import {
  maybeCreateSceneEvent,
} from '../utils/sceneEngine'

import {
  getRelevantExperienceMemories,
} from '../utils/memory'


export type DialogueResponse = {
  text: string
}


type GenerateDialogueOptions = {
  args:
    ReplyHandlerArgs

  roleplayInterpretation:
    RoleplayInterpretation

  presenceState:
    PresenceState

  perceptionState:
    PerceptionState

  chemistry:
    ChemistryEvaluation
}


type OllamaChatResponse = {
  message?: {
    role?: string
    content?: string
  }
}


type OllamaMessage = {
  role:
    | 'system'
    | 'user'
    | 'assistant'

  content:
    string
}


type PerspectiveValidationResult = {
  valid: boolean

  reasons: string[]
}


const OLLAMA_URL =
  'http://localhost:11434/api/chat'


const OLLAMA_MODEL =
  'llama3:8b'


function formatList(
  title: string,
  items: string[],
) {
  if (
    items.length === 0
  ) {
    return `${title}: None`
  }

  return [
    `${title}:`,
    ...items.map(
      (item) =>
        `- ${item}`,
    ),
  ].join('\n')
}


function buildActiveStoryContext(
  args: ReplyHandlerArgs,
) {
  const lifeState =
    getLifeState(
      args.context.characterId,
    )

  const currentEvent =
    lifeState.currentEvent

  if (!currentEvent) {
    return ''
  }

  return `
ACTIVE STORY EVENT

Title:
${currentEvent.title}

Description:
${currentEvent.description}

Current activity:
${lifeState.currentActivity}

Current location:
${lifeState.currentLocation}

Story status:
${
  currentEvent.discussed
    ? 'The character has already introduced this event to the user, but the event is still active and unresolved.'
    : 'The event has not yet been introduced to the user.'
}

STORY GUIDANCE

This event remains part of ${args.characterName}'s current life.

Do not force every response to mention it.

If the current moment relates to it, continue it naturally.

Do not repeat the event description word-for-word.

Do not invent major consequences unsupported by the existing story.

Do not mention Life Engine, story state, prompts, or internal mechanics.
`.trim()
}


function buildSceneVisibilityInstruction(
  visibility:
    | 'ambient'
    | 'observable'
    | 'interrupting',

  characterName:
    string,
) {
  switch (
    visibility
  ) {
    case 'ambient':
      return `
VISIBILITY LEVEL: AMBIENT

This is background atmosphere.

You may mention it if it naturally improves the scene.

You may leave it in the background when it is unimportant.
`.trim()

    case 'observable':
      return `
VISIBILITY LEVEL: OBSERVABLE

THIS EVENT MUST APPEAR IN THE RESPONSE.

It physically happened in ${characterName}'s scene.

Make it visible naturally through narration, action, attention, body language, or reaction.

It does not need to dominate the response.
`.trim()

    case 'interrupting':
      return `
VISIBILITY LEVEL: INTERRUPTING

THIS EVENT MUST VISIBLY OCCUR AND AFFECT THE CURRENT MOMENT.

Show the interruption clearly.

Then let ${characterName} independently decide how to respond.

The character may acknowledge it, dismiss it, delay dealing with it, respond to it, or return to what they were doing.
`.trim()
  }
}


function buildSceneContext(
  args: ReplyHandlerArgs,
) {
  const lifeState =
    getLifeState(
      args.context.characterId,
    )

  const currentEvent =
    lifeState.currentEvent

  const sceneEvent =
    maybeCreateSceneEvent({
      characterName:
        args.characterName,

      currentLocation:
        lifeState.currentLocation,

      currentActivity:
        lifeState.currentActivity,

      mood:
        args.context.mood.mood,

      relationshipStage:
        args.context.relationshipStage,

      activeStoryTitle:
        currentEvent?.title,

      activeStoryDescription:
        currentEvent?.description,
    })

  if (!sceneEvent) {
    return ''
  }

  console.log(
    '[VelvetVerse Scene Event]',
    {
      character:
        args.characterName,

      type:
        sceneEvent.type,

      visibility:
        sceneEvent.visibility,

      description:
        sceneEvent.description,

      instruction:
        sceneEvent.instruction,
    },
  )

  const visibilityInstruction =
    buildSceneVisibilityInstruction(
      sceneEvent.visibility,
      args.characterName,
    )

  return `
SCENE EVENT

Event type:
${sceneEvent.type}

Visibility:
${sceneEvent.visibility}

What physically happened:
${sceneEvent.description}

Specific guidance:
${sceneEvent.instruction}

${visibilityInstruction}

SCENE RULES

This happened naturally in ${args.characterName}'s current physical scene.

If this is a character action, it is something ${args.characterName} independently chose to do.

If this is an NPC event, treat the NPC as an independent minor presence appropriate to the location.

Do not give the user control over ${args.characterName} or an NPC merely because the user narrated something.

Do not explain that the event was generated.

Do not mention Scene Engine, visibility levels, randomness, probability, prompts, or internal mechanics.
`.trim()
}


function buildPresenceAndPerceptionContext(
  args:
    ReplyHandlerArgs,

  presenceState:
    PresenceState,

  perceptionState:
    PerceptionState,

  interpretation:
    RoleplayInterpretation,
) {
  const separated =
    !perceptionState
      .directConversationPossible

  const modeInstruction =
    separated
      ? `
THE USER AND ${args.characterName.toUpperCase()} ARE PHYSICALLY SEPARATED.

This is critical.

${args.characterName} cannot directly speak to the user as though they are in the same room.

${args.characterName} cannot look into the user's eyes.

${args.characterName} cannot touch the user.

${args.characterName} cannot see the user's actions at their separate location.

${args.characterName} cannot hear words that were not spoken within hearing range.

${args.characterName} cannot know the user's private thoughts, fantasies, dreams, intentions, or internal monologue.

Do NOT use telepathy unless an established character ability and current story explicitly support telepathy.

Do NOT write phrases implying that ${args.characterName} somehow senses the user's thoughts.

Do NOT narrate ${args.characterName}'s gaze meeting the user's while they are apart.

SEPARATED-SCENE PERSPECTIVE

Write only from ${args.characterName}'s local scene.

Do NOT narrate what the user is currently seeing.

Do NOT narrate what the user is currently feeling.

Do NOT narrate what the user is currently thinking.

Do NOT narrate what the user is currently wondering.

Do NOT describe the user's body language or activity at the separate location.

Do NOT address the user directly.

Do NOT use second-person narration about the user's remote experience.

When separated, the words "you", "your", and "yours" should normally not appear in narration.

Never return narration to the user's location before the response ends.

Stay with ${args.characterName}'s scene until the response ends.

CHARACTER INDEPENDENCE

${args.characterName} continues existing while the user is elsewhere.

Prefer concrete character behaviour.

Have ${args.characterName} actually do something appropriate to:

- current location;
- current activity;
- mood;
- personality;
- goals;
- fears;
- active story;
- immediate surroundings.

Possible behaviour includes:

- reading;
- writing;
- preparing for sleep;
- investigating something;
- examining an object;
- speaking with an NPC;
- moving through the location;
- tending to unfinished work;
- making a decision;
- reacting to a scene event;
- privately reflecting on something that genuinely happened earlier.

Do not repeatedly substitute vague atmospheric filler for behaviour.

${args.characterName} does NOT have to think about the user.

If ${args.characterName} independently thinks about or remembers the user, that may happen because of established shared history.

It must NOT happen because ${args.characterName} somehow knows what the user is currently thinking, feeling, dreaming, or doing.

The result should read like a fresh parallel scene following ${args.characterName}.
`
      : `
THE USER AND ${args.characterName.toUpperCase()} ARE TOGETHER OR CLOSE ENOUGH FOR NORMAL INTERACTION.

Normal visible actions, audible speech, eye contact, and physical reactions are possible when supported by the scene.

Private user thoughts still remain private.

The fact that the model can read a private thought does not mean ${args.characterName} knows it.

${args.characterName} must independently interpret visible or audible behaviour rather than automatically knowing the user's intention.
`

  return `
PHYSICAL PRESENCE AND PERCEPTION

User location:
${presenceState.userLocation}

${args.characterName} location:
${presenceState.characterLocation}

Presence mode:
${presenceState.mode}

Direct conversation possible:
${perceptionState.directConversationPossible}

Can see user:
${perceptionState.characterCanSeeUser}

Can hear user:
${perceptionState.characterCanHearUser}

Can touch user:
${perceptionState.characterCanTouchUser}

Can user physically touch character:
${perceptionState.characterCanBeTouchedByUser}

${modeInstruction.trim()}

WHAT ${args.characterName.toUpperCase()} CAN ACTUALLY HEAR

${formatList(
  'Heard dialogue',
  perceptionState.heardDialogue,
)}

WHAT ${args.characterName.toUpperCase()} CAN ACTUALLY SEE

${formatList(
  'Visible user actions',
  perceptionState.visibleUserActions,
)}

PRIVATE USER INFORMATION

Private user thoughts and hidden narration are intentionally OMITTED from this prompt.

${args.characterName} has no access to their content.

Do not mention that private information exists.
Do not say ${args.characterName} is unaware of it.
Simply continue using only information ${args.characterName} can actually perceive.

UNVERIFIED USER CLAIMS

These claims do not automatically become true:

${formatList(
  'Blocked or unverified claims',
  perceptionState.blockedClaims,
)}

ROLEPLAY INTERPRETATION

Only perceivable roleplay information is included below.

${formatList(
  'Spoken dialogue',
  perceptionState.heardDialogue,
)}

${formatList(
  'Visible user actions',
  perceptionState.visibleUserActions,
)}

Private thoughts, private observations, and hidden narration are omitted.

Movement changed location:
${interpretation.movement.changesLocation}

Movement target:
${interpretation.movement.targetLocation ?? 'None'}

User left character:
${interpretation.movement.leavesCharacter}

User approached character:
${interpretation.movement.approachesCharacter}

PERCEPTION OVERRIDES RAW MESSAGE TEXT

The raw user message may contain private thoughts, narration, attempted character control, or events outside ${args.characterName}'s perception.

Never assume that because text appears in the user message, ${args.characterName} knows it.

Use the perception results above as the source of truth for what ${args.characterName} knows.
`.trim()
}


function buildExperienceMemoryContext(
  args:
    ReplyHandlerArgs,
) {
  const memories =
    getRelevantExperienceMemories(
      args.context.characterId,
      6,
    )

  if (
    memories.length === 0
  ) {
    return ''
  }

  const memoryLines =
    memories.map(
      (memory) =>
        `- [${memory.type}] ${memory.summary}`,
    )

  return `
CHARACTER EXPERIENCE MEMORY

These are genuine past experiences that ${args.characterName} remembers because they were previously perceived and stored by VelvetVerse.

${memoryLines.join('\n')}

MEMORY GUIDANCE

Use these memories only when they are naturally relevant to the current conversation, question, relationship, or scene.

If the user asks whether ${args.characterName} remembers something listed above, ${args.characterName} may recall its meaning confidently and naturally.

Do not pretend to remember details that are not present in these memories.

Do not quote a memory word-for-word unless natural. Paraphrase it as an actual recollection.

Do not force memories into unrelated responses.

Do not mention memory storage, memory records, memory types, importance values, prompts, databases, localStorage, or internal systems.

These memories never grant access to the user's private thoughts or other information that ${args.characterName} did not perceive.
`.trim()
}


function buildChemistryContext(
  args:
    ReplyHandlerArgs,

  chemistry:
    ChemistryEvaluation,
) {
  return `
CHEMISTRY STATE

Current chemistry reaction:
${chemistry.reaction}

Attraction:
${chemistry.after.attraction}

Romantic interest:
${chemistry.after.romanticInterest}

Flirtation comfort:
${chemistry.after.flirtationComfort}

Tension:
${chemistry.after.tension}

Trust for intimacy:
${chemistry.after.trustForIntimacy}

Boundary pressure:
${chemistry.after.boundaryPressure}

CHEMISTRY GUIDANCE

This chemistry state influences ${args.characterName}'s private emotional response and visible behaviour.

It does NOT override:

- personality;
- consent;
- boundaries;
- relationship history;
- mood;
- perception;
- current circumstances.

REACTION MEANINGS

neutral:
No meaningful chemistry response is required.

noticed:
${args.characterName} noticed the flirtatious or romantic undertone, but does not need to reciprocate.

intrigued:
${args.characterName} may show increased attention, curiosity, subtle interest, or awareness.

flustered:
${args.characterName} may show a restrained involuntary reaction, hesitation, composure shift, or heightened tension.

receptive:
${args.characterName} is comfortable enough to reciprocate some flirtation naturally.

guarded:
Attraction or tension may exist, but ${args.characterName} remains emotionally or socially guarded.

uncomfortable:
${args.characterName} should create distance, show discomfort, redirect, or reinforce a boundary.

rejecting:
${args.characterName} should clearly reject or shut down the current behaviour.

IMPORTANT

Attraction is not permission.

Romantic interest is not consent.

Tension is not automatically positive.

A character may feel attraction and still refuse, withdraw, challenge, ignore, or remain guarded.

Do not mention chemistry scores, chemistry state, reaction labels, or internal systems in the visible response.
`.trim()
}


function buildCharacterPerspectiveInstruction(
  args: ReplyHandlerArgs,
) {
  return `
CHARACTER IDENTITY AND NARRATIVE STYLE

The response belongs to ${args.characterName}.

Maintain ${args.characterName}'s identity and perspective throughout the entire response.

NARRATIVE STYLE LOCK

VelvetVerse uses:

THIRD-PERSON CHARACTER NARRATION
+
FIRST-PERSON CHARACTER SPEECH

Narrate ${args.characterName}'s actions, expressions, body language, emotions, surroundings, and reactions in third person.

Use first-person language only inside ${args.characterName}'s spoken dialogue.

Character speech must normally be enclosed in quotation marks.

Outside character dialogue, do NOT use:

- I
- me
- my
- mine
- myself
- we
- us
- our
- ours
- ourselves

as the narrator's point of view.

GOOD EXAMPLE:

${args.characterName}'s eyes narrow slightly as she studies the user.

"So that is what you think?" she says.

BAD EXAMPLE:

${args.characterName}'s eyes narrow slightly.

I feel my composure slipping.

"Interesting," she says.

BAD EXAMPLE:

Her gaze lingers on mine.

That incorrectly turns the narrator into the user.

USER PERSPECTIVE RULE

Never narrate the user's private:

- thoughts;
- feelings;
- reactions;
- memories;
- observations;
- intentions;
- internal experience.

Never switch viewpoint into the user's mind.

PRIVATE THOUGHT BOUNDARY

If the user has a private thought, ${args.characterName} does not know that thought exists unless a valid established in-world mechanic permits it.

Do NOT acknowledge hidden thoughts merely to say ${args.characterName} does not know them.

Do NOT write:

"${args.characterName} remains unaware of the user's private thoughts."

"${args.characterName} is oblivious to the user's inner musings."

Instead, ignore inaccessible information completely.

FINAL CONSISTENCY RULE

The response must remain on ${args.characterName}'s side of the scene from beginning to end.

Do not switch viewpoint mid-response.
`.trim()
}


function buildPerceivedUserMessage(
  args:
    ReplyHandlerArgs,

  perceptionState:
    PerceptionState,
) {
  const parts:
    string[] = []

  if (
    perceptionState
      .heardDialogue
      .length > 0
  ) {
    parts.push(
      ...perceptionState
        .heardDialogue
        .map(
          (dialogue) =>
            `The user says: "${dialogue}"`,
        ),
    )
  }

  if (
    perceptionState
      .visibleUserActions
      .length > 0
  ) {
    parts.push(
      ...perceptionState
        .visibleUserActions
        .map(
          (action) =>
            `The user visibly does: ${action}`,
        ),
    )
  }

  if (
    parts.length === 0
  ) {
    return `${args.characterName} perceives no new user speech or visible action in this moment. Continue naturally without acknowledging hidden or inaccessible user information.`
  }

  return parts.join(
    '\n',
  )
}


function buildSafePromptArgs(
  args:
    ReplyHandlerArgs,

  perceptionState:
    PerceptionState,
): ReplyHandlerArgs {
  /*
   * Historical raw user messages may contain
   * private thoughts or narration from earlier
   * turns. Until perception metadata is stored
   * per historical turn, do not expose those
   * raw user messages to the dialogue model.
   *
   * Character replies are retained so the
   * character can preserve its own immediate
   * scene continuity.
   */

  const safeConversationHistory =
    args.conversationHistory
      .filter(
        (message) =>
          message.sender !==
          'user',
      )
      .slice(-8)

  return {
    ...args,

    userMessage:
      buildPerceivedUserMessage(
        args,
        perceptionState,
      ),

    conversationHistory:
      safeConversationHistory,
  }
}


function buildConversationMessages(
  args:
    ReplyHandlerArgs,

  perceptionState:
    PerceptionState,
): OllamaMessage[] {
  const messages:
    OllamaMessage[] = []

  /*
   * Only character-side historical messages
   * are supplied here. Raw historical user
   * messages are intentionally excluded because
   * they may contain private thoughts that were
   * never perceived by the character.
   */

  const recentCharacterHistory =
    args.conversationHistory
      .filter(
        (message) =>
          message.sender !==
          'user',
      )
      .slice(-6)

  for (
    const message of
    recentCharacterHistory
  ) {
    const content =
      sanitizeInternalMetaLeak(
        message.text.trim(),
      )

    if (!content) {
      continue
    }

    messages.push({
      role:
        'assistant',

      content,
    })
  }

  if (
    perceptionState
      .directConversationPossible
  ) {
    messages.push({
      role:
        'user',

      content:
        buildPerceivedUserMessage(
          args,
          perceptionState,
        ),
    })

    return messages
  }

  /*
   * When physically separated, the raw remote
   * user message is NEVER sent to Ollama.
   * The character receives only an instruction
   * to continue its own local scene.
   */

  messages.push({
    role:
      'user',

    content: `
The user is physically elsewhere.

No remote private narration, thoughts, or unseen actions are available to ${args.characterName}.

Continue ${args.characterName}'s independent local scene naturally.

Do not acknowledge hidden user activity.

Do not explain these rules.
`.trim(),
  })

  return messages
}

/*
 * ================================================================
 * QUOTED-DIALOGUE MASK
 * ================================================================
 *
 * The validator must allow:
 *
 * "I don't believe you."
 *
 * but reject narration such as:
 *
 * Her gaze lingers on mine.
 *
 * This function removes quoted character
 * dialogue from the text before checking
 * narration pronouns.
 */

function getNarrationOnly(
  text: string,
) {
  let result = ''

  let insideStraightQuote =
    false

  let insideCurlyQuote =
    false

  for (
    const character of
    text
  ) {
    if (
      character === '"'
    ) {
      insideStraightQuote =
        !insideStraightQuote

      result += ' '

      continue
    }

    if (
      character === '“'
    ) {
      insideCurlyQuote =
        true

      result += ' '

      continue
    }

    if (
      character === '”'
    ) {
      insideCurlyQuote =
        false

      result += ' '

      continue
    }

    if (
      insideStraightQuote ||
      insideCurlyQuote
    ) {
      result +=
        character === '\n'
          ? '\n'
          : ' '

      continue
    }

    result +=
      character
  }

  return result
}


/*
 * ================================================================
 * PERSPECTIVE VALIDATOR
 * ================================================================
 *
 * Prompt instructions guide Ollama.
 *
 * This validator ENFORCES the important
 * perspective and perception rules after
 * generation.
 */

function validateDialoguePerspective(
  text: string,

  perceptionState:
    PerceptionState,
): PerspectiveValidationResult {
  const reasons:
    string[] = []

  const narration =
    getNarrationOnly(
      text,
    )

  /*
   * Narration is third person.
   *
   * First-person pronouns outside
   * quoted character dialogue indicate
   * a viewpoint switch.
   */

  const firstPersonNarration =
    /\b(i|me|my|mine|myself|we|us|our|ours|ourselves)\b/i

  if (
    firstPersonNarration.test(
      narration,
    )
  ) {
    reasons.push(
      'First-person pronoun detected in narration outside character dialogue.',
    )
  }

  /*
   * ================================================================
   * USER SUBJECTIVE-PERSPECTIVE GUARD
   * ================================================================
   *
   * Shared scenes may describe externally
   * observable character actions involving
   * the user, e.g. "She looks at you."
   *
   * They may NOT decide the user's attention,
   * perception, feelings, thoughts, memories,
   * intentions, or internal reactions.
   */

  const userSubjectiveNarrationPatterns:
    RegExp[] = [
      /\byou\s+(?:feel|felt|think|thought|wonder|wondered|notice|noticed|realize|realized|remember|remembered|imagine|imagined|sense|sensed|know|knew|believe|believed|want|wanted|hope|hoped|fear|feared|decide|decided|intend|intended|watch|watched|stare|stared|gaze|gazed|look|looked|listen|listened)\b/i,

      /\byou(?:'re|\s+are)\s+(?:watching|looking|staring|gazing|thinking|wondering|feeling|noticing|remembering|imagining|sensing|hoping|fearing|aware|unaware|curious|intrigued|uneasy|nervous|excited|afraid|confused|surprised|drawn|captivated|mesmerized)\b/i,

      /\byou(?:'re|\s+are)\s+not\s+(?:watching|looking|staring|gazing|thinking|wondering|feeling|noticing|remembering|imagining|listening)\b/i,

      /\byour\s+(?:gaze|attention|focus|thoughts?|mind|memory|memories|imagination|feelings?|emotions?|curiosity|interest|awareness|desire|intentions?|reaction|reactions)\b/i,

      /\bin\s+your\s+(?:gaze|mind|thoughts?|memory|memories|imagination|awareness)\b/i,

      /\b(?:lingers?|remains?|echoes?|stays?)\s+in\s+your\s+(?:mind|thoughts?|memory|memories|imagination|awareness)\b/i,

      /\bleav(?:e|es|ing)\s+you\s+(?:feeling|thinking|wondering|believing|imagining|remembering|wanting|hoping|fearing|uneasy|curious|intrigued|confused|surprised|captivated|mesmerized)\b/i,

      /\bmakes?\s+you\s+(?:feel|think|wonder|notice|realize|remember|imagine|want|hope|fear)\b/i,

      /\bcaus(?:e|es|ing)\s+you\s+to\s+(?:feel|think|wonder|notice|realize|remember|imagine|want|hope|fear)\b/i,

      /\byou\s+can(?:not|'t)?\s+(?:help|stop|resist)\b/i,
    ]

  const controlsUserSubjectiveExperience =
    userSubjectiveNarrationPatterns.some(
      (pattern) =>
        pattern.test(
          narration,
        ),
    )

  if (
    controlsUserSubjectiveExperience
  ) {
    reasons.push(
      'Narration assigns the user a subjective perception, attention, thought, feeling, memory, intention, or reaction.',
    )
  }

  /*
   * While separated, narration must not
   * return to the user's second-person
   * remote perspective at all.
   */

  if (
    !perceptionState
      .directConversationPossible
  ) {
    const remoteSecondPersonNarration =
      /\b(you|your|yours|yourself|yourselves)\b/i

    if (
      remoteSecondPersonNarration.test(
        narration,
      )
    ) {
      reasons.push(
        'Second-person user narration detected while the user and character are separated.',
      )
    }
  }

  /*
   * If private user thoughts exist,
   * the response may not acknowledge
   * those thoughts, even by saying the
   * character is unaware of them.
   */

  if (
    perceptionState
      .privateUserThoughts
      .length > 0
  ) {
    const hiddenThoughtAwarenessPatterns:
      RegExp[] = [
        /\bprivate thoughts?\b/i,
        /\binner musings?\b/i,
        /\bhidden fantasies?\b/i,
        /\bsecret intentions?\b/i,
        /\bunspoken feelings?\b/i,
        /\byour thoughts?\b/i,
        /\byour mind\b/i,
        /\byour imagination\b/i,
        /\byour dreams?\b/i,
        /\bunaware of your\b/i,
        /\boblivious to your\b/i,
        /\bsenses? your\b/i,
        /\bsensing your\b/i,
      ]

    const mentionsHiddenThoughts =
      hiddenThoughtAwarenessPatterns
        .some(
          (pattern) =>
            pattern.test(
              text,
            ),
        )

    if (
      mentionsHiddenThoughts
    ) {
      reasons.push(
        'Response acknowledges private user information that the character cannot perceive.',
      )
    }
  }

  return {
    valid:
      reasons.length === 0,

    reasons,
  }
}


/*
 * ================================================================
 * OLLAMA REQUEST
 * ================================================================
 */

async function requestOllamaDialogue(
  messages:
    OllamaMessage[],

  temperature:
    number = 0.76,

  topP:
    number = 0.9,

  repeatPenalty:
    number = 1.22,
) {
  const response =
    await fetch(
      OLLAMA_URL,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            model:
              OLLAMA_MODEL,

            stream:
              false,

            messages,

            options: {
              temperature,

              top_p:
                topP,

              repeat_penalty:
                repeatPenalty,
            },
          }),
      },
    )

  if (
    !response.ok
  ) {
    throw new Error(
      `Ollama dialogue request failed with status ${response.status}.`,
    )
  }

  const data: unknown =
    await response.json()

  if (
    typeof data !==
      'object' ||
    data === null
  ) {
    throw new Error(
      'Ollama returned an invalid response.',
    )
  }

  const ollamaResponse =
    data as OllamaChatResponse

  const text =
    ollamaResponse.message
      ?.content
      ?.trim()

  if (!text) {
    throw new Error(
      'Ollama returned an empty dialogue response.',
    )
  }

  return text
}


/*
 * ================================================================
 * AUTOMATIC PERSPECTIVE REWRITE
 * ================================================================
 */

async function rewriteDialogueForPerspective({
  originalText,
  validation,
  finalPrompt,
  conversationMessages,
  characterName,
}: {
  originalText: string

  validation:
    PerspectiveValidationResult

  finalPrompt: string

  conversationMessages:
    OllamaMessage[]

  characterName: string
}) {
  const correctionInstruction =
    `
PERSPECTIVE CORRECTION REQUIRED

The previous assistant response violated VelvetVerse narrative rules.

Detected problems:

${validation.reasons
  .map(
    (reason) =>
      `- ${reason}`,
  )
  .join('\n')}

Rewrite the previous assistant response.

IMPORTANT:

Preserve the same character decision, emotional reaction, tone, scene continuity, and substantive meaning.

Do NOT invent a new event.

Do NOT change what ${characterName} decided.

Do NOT add knowledge the character does not possess.

Fix only the narrative perspective, pronoun ownership, and perception violations.

Use:

THIRD-PERSON CHARACTER NARRATION
+
FIRST-PERSON CHARACTER SPEECH IN QUOTATION MARKS

Outside quoted dialogue, never use first-person narration.

Never narrate the user's private internal state.

Never decide what the user is looking at, watching, noticing, feeling, thinking, remembering, imagining, wanting, or experiencing.

Do not write phrases such as "in your gaze", "your attention", "you are watching", "you are not watching", "leaving you wondering", or similar subjective user narration.

You MAY describe ${characterName}'s externally observable actions toward the user, such as "${characterName} looks at you" or "${characterName}'s hand brushes yours", when physically possible.

Never acknowledge private user thoughts that the character cannot perceive.

Return ONLY the corrected in-character response.
`.trim()

  const rewriteMessages:
    OllamaMessage[] = [
      {
        role:
          'system',

        content:
          `${finalPrompt}\n\n${correctionInstruction}`,
      },

      ...conversationMessages,

      {
        role:
          'assistant',

        content:
          originalText,
      },

      {
        role:
          'user',

        content:
          'Rewrite the previous assistant response according to the correction rules. Return only the corrected response.',
      },
    ]

  return requestOllamaDialogue(
    rewriteMessages,
    0.35,
    0.8,
    1.28,
  )
}


/*
 * ================================================================
 * INTERNAL META-LEAK PROTECTION
 * ================================================================
 */

function containsInternalMetaLeak(
  value: string,
) {
  const patterns:
    RegExp[] = [
      /\bscene event\b/i,
      /\bevent type\s*:/i,
      /\bvisibility level\s*:/i,
      /\bvisibility\s*:/i,
      /\bscene engine\b/i,
      /\blife engine\b/i,
      /\bpresence engine\b/i,
      /\bperception engine\b/i,
      /\brelationship engine\b/i,
      /\bchemistry engine\b/i,
      /\broleplay interpreter\b/i,
      /\bresponse planner\b/i,
      /\bsystem prompt\b/i,
      /\bsystem instruction\b/i,
      /\binternal mechanics?\b/i,
      /\binternal system\b/i,
      /\bgenerated event\b/i,
      /\brandom event\b/i,
      /\bvisibility levels?\b/i,
      /\bnote\s*:\s*since\b/i,
      /\buser'?s internal state\b/i,
      /\bcannot perceive\b/i,
      /\bprivate user information\b/i,
      /\bprivate user thoughts?\b/i,
      /\binner musings?\b/i,
      /\bhidden narration\b/i,
      /\bperception results?\b/i,
      /\bsource of truth\b/i,
      /\bdo not acknowledge\b/i,
      /\bdoes not acknowledge\b/i,
    ]

  return patterns.some(
    (pattern) =>
      pattern.test(
        value,
      ),
  )
}


function sanitizeInternalMetaLeak(
  text: string,
) {
  let cleaned =
    text.replace(
      /\([^()]*\)/g,
      (match) =>
        containsInternalMetaLeak(
          match,
        )
          ? ''
          : match,
    )

  cleaned =
    cleaned
      .split('\n')
      .filter(
        (line) =>
          !containsInternalMetaLeak(
            line,
          ),
      )
      .join('\n')
      .replace(
        /\n{3,}/g,
        '\n\n',
      )
      .replace(
        /[ \t]{2,}/g,
        ' ',
      )
      .trim()

  return cleaned
}


function validateInternalMetaLeak(
  text: string,
) {
  return containsInternalMetaLeak(
    text,
  )
}


export async function generateDialogue({
  args,
  roleplayInterpretation,
  presenceState,
  perceptionState,
  chemistry,
}: GenerateDialogueOptions):
Promise<DialogueResponse> {
  console.log(
    '[VelvetVerse generateDialogue ENTERED]',
    {
      character:
        args.characterName,

      message:
        args.userMessage,

      presence:
        presenceState,

      perception:
        perceptionState,
    },
  )

  /*
   * ================================================================
   * PERCEPTION-SAFE PROMPT INPUT
   * ================================================================
   *
   * buildCharacterPrompt previously received
   * the raw user message and raw conversation
   * history. That allowed private thoughts from
   * earlier turns to leak back into dialogue.
   *
   * From this point onward the dialogue model
   * receives only perception-safe user input.
   */

  const safeArgs =
    buildSafePromptArgs(
      args,
      perceptionState,
    )

  const basePrompt =
    buildCharacterPrompt(
      safeArgs,
    )

  const activeStoryContext =
    buildActiveStoryContext(
      safeArgs,
    )

  const presenceContext =
    buildPresenceAndPerceptionContext(
      safeArgs,
      presenceState,
      perceptionState,
      roleplayInterpretation,
    )

  const experienceMemoryContext =
    buildExperienceMemoryContext(
      safeArgs,
    )


  const perspectiveContext =
    buildCharacterPerspectiveInstruction(
      safeArgs,
    )

  const chemistryContext =
    buildChemistryContext(
      safeArgs,
      chemistry,
    )

  const sceneContext =
    buildSceneContext(
      safeArgs,
    )

  const promptSections = [
    basePrompt,
    activeStoryContext,
    presenceContext,
    experienceMemoryContext,
    chemistryContext,
    perspectiveContext,
    sceneContext,
  ].filter(
    (section) =>
      section.trim().length > 0,
  )

  const finalPrompt =
    promptSections.join(
      '\n\n',
    )

  console.log(
    '[VelvetVerse FINAL PROMPT]',
    finalPrompt,
  )

  const conversationMessages =
    buildConversationMessages(
      safeArgs,
      perceptionState,
    )

  const messages:
    OllamaMessage[] = [
      {
        role:
          'system',

        content:
          finalPrompt,
      },

      ...conversationMessages,
    ]

  console.log(
    '[VelvetVerse OLLAMA MESSAGES]',
    messages,
  )

  /*
   * ================================================================
   * FIRST GENERATION
   * ================================================================
   */

  let text =
    await requestOllamaDialogue(
      messages,
    )

  let validation =
    validateDialoguePerspective(
      text,
      perceptionState,
    )

  console.log(
    '[VelvetVerse Perspective Validation]',
    {
      character:
        args.characterName,

      valid:
        validation.valid,

      reasons:
        validation.reasons,

      text,
    },
  )

  /*
   * ================================================================
   * AUTOMATIC CORRECTION
   * ================================================================
   *
   * Give Ollama up to two opportunities
   * to repair perspective violations.
   *
   * Usually the first rewrite should fix
   * something like:
   *
   * "her gaze lingers on mine"
   */

  let correctionAttempt =
    0

  const maximumCorrectionAttempts =
    2

  while (
    !validation.valid &&
    correctionAttempt <
      maximumCorrectionAttempts
  ) {
    correctionAttempt += 1

    console.warn(
      '[VelvetVerse Perspective Correction]',
      {
        character:
          args.characterName,

        attempt:
          correctionAttempt,

        reasons:
          validation.reasons,
      },
    )

    text =
      await rewriteDialogueForPerspective({
        originalText:
          text,

        validation,

        finalPrompt,

        conversationMessages,

        characterName:
          args.characterName,
      })

    validation =
      validateDialoguePerspective(
        text,
        perceptionState,
      )

    console.log(
      '[VelvetVerse Perspective Revalidation]',
      {
        character:
          args.characterName,

        attempt:
          correctionAttempt,

        valid:
          validation.valid,

        reasons:
          validation.reasons,

        text,
      },
    )
  }

  /*
   * We do not crash the entire chat if
   * Ollama still fails stylistically after
   * the correction attempts.
   *
   * Log it clearly so we can tune the
   * validator/model later.
   */

  if (
    !validation.valid
  ) {
    console.warn(
      '[VelvetVerse Perspective Validator] Response still contains a possible perspective issue after correction attempts.',
      {
        character:
          args.characterName,

        reasons:
          validation.reasons,

        text,
      },
    )
  }

  /*
   * ================================================================
   * INTERNAL META-LEAK SANITIZATION
   * ================================================================
   */

  const containedMetaLeak =
    validateInternalMetaLeak(
      text,
    )

  if (
    containedMetaLeak
  ) {
    console.warn(
      '[VelvetVerse Internal Meta Leak]',
      {
        character:
          args.characterName,

        originalText:
          text,
      },
    )
  }

  const sanitizedText =
    sanitizeInternalMetaLeak(
      text,
    )

  if (
    !sanitizedText
  ) {
    throw new Error(
      'Dialogue became empty after internal meta-leak sanitization.',
    )
  }

  console.log(
    '[VelvetVerse Final Dialogue]',
    {
      character:
        args.characterName,

      metaLeakDetected:
        containedMetaLeak,

      text:
        sanitizedText,
    },
  )

  return {
    text:
      sanitizedText,
  }
}