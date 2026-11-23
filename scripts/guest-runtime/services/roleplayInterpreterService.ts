import type {
  CharacterEngineContext,
} from '../utils/characterEngine'

import type {
  ConversationHistoryMessage,
} from '../utils/replies/types'

import { fetchModelJson } from '../../shared/fetchModelJson'

export type RoleplayMovement = {
  changesLocation:
    boolean

  targetLocation:
    string | null

  leavesCharacter:
    boolean

  approachesCharacter:
    boolean
}

export type RoleplayClaimType =
  | 'character_action'
  | 'character_feeling'
  | 'character_thought'
  | 'character_memory'
  | 'world_effect'
  | 'relationship_state'
  | 'unknown'

export type RoleplayClaim = {
  type:
    RoleplayClaimType

  description:
    string

  hiddenFromCharacter:
    boolean
}

export type RoleplayInterpretation = {
  spokenDialogue:
    string[]

  userActions:
    string[]

  userThoughts:
    string[]

  observations:
    string[]

  narration:
    string[]

  movement:
    RoleplayMovement

  claims:
    RoleplayClaim[]
}

type RoleplayInterpreterArgs = {
  signal?: AbortSignal
  context:
    CharacterEngineContext

  characterName:
    string

  userMessage:
    string

  conversationHistory:
    ConversationHistoryMessage[]
}

type OllamaChatResponse = {
  message?: {
    role?: string
    content?: string
  }
}

const OLLAMA_URL =
  'http://localhost:11434/api/chat'

const OLLAMA_MODEL =
  'llama3:8b'

function createEmptyInterpretation():
RoleplayInterpretation {
  return {
    spokenDialogue: [],

    userActions: [],

    userThoughts: [],

    observations: [],

    narration: [],

    movement: {
      changesLocation:
        false,

      targetLocation:
        null,

      leavesCharacter:
        false,

      approachesCharacter:
        false,
    },

    claims: [],
  }
}

function toStringArray(
  value: unknown,
) {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return []
  }

  return value
    .filter(
      (item) =>
        typeof item ===
        'string',
    )
    .map(
      (item) =>
        item.trim(),
    )
    .filter(Boolean)
}

function normalizeMovement(
  value: unknown,
): RoleplayMovement {
  if (
    typeof value !==
      'object' ||
    value === null
  ) {
    return {
      changesLocation:
        false,

      targetLocation:
        null,

      leavesCharacter:
        false,

      approachesCharacter:
        false,
    }
  }

  const movement =
    value as Record<
      string,
      unknown
    >

  return {
    changesLocation:
      movement.changesLocation ===
      true,

    targetLocation:
      typeof movement.targetLocation ===
        'string' &&
      movement.targetLocation.trim()
        ? movement.targetLocation.trim()
        : null,

    leavesCharacter:
      movement.leavesCharacter ===
      true,

    approachesCharacter:
      movement.approachesCharacter ===
      true,
  }
}

function normalizeClaimType(
  value: unknown,
): RoleplayClaimType {
  switch (value) {
    case 'character_action':
    case 'character_feeling':
    case 'character_thought':
    case 'character_memory':
    case 'world_effect':
    case 'relationship_state':
      return value

    default:
      return 'unknown'
  }
}

function normalizeClaims(
  value: unknown,
): RoleplayClaim[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return []
  }

  const claims:
    RoleplayClaim[] = []

  for (
    const item of
    value
  ) {
    if (
      typeof item !==
        'object' ||
      item === null
    ) {
      continue
    }

    const claim =
      item as Record<
        string,
        unknown
      >

    if (
      typeof claim.description !==
        'string' ||
      !claim.description.trim()
    ) {
      continue
    }

    claims.push({
      type:
        normalizeClaimType(
          claim.type,
        ),

      description:
        claim.description.trim(),

      hiddenFromCharacter:
        claim.hiddenFromCharacter ===
        true,
    })
  }

  return claims
}

function normalizeInterpretation(
  value: unknown,
): RoleplayInterpretation {
  if (
    typeof value !==
      'object' ||
    value === null
  ) {
    return createEmptyInterpretation()
  }

  const parsed =
    value as Record<
      string,
      unknown
    >

  return {
    spokenDialogue:
      toStringArray(
        parsed.spokenDialogue,
      ),

    userActions:
      toStringArray(
        parsed.userActions,
      ),

    userThoughts:
      toStringArray(
        parsed.userThoughts,
      ),

    observations:
      toStringArray(
        parsed.observations,
      ),

    narration:
      toStringArray(
        parsed.narration,
      ),

    movement:
      normalizeMovement(
        parsed.movement,
      ),

    claims:
      normalizeClaims(
        parsed.claims,
      ),
  }
}

function extractJson(
  text: string,
): unknown {
  const cleaned =
    text
      .replace(
        /```json/gi,
        '',
      )
      .replace(
        /```/g,
        '',
      )
      .trim()

  const firstBrace =
    cleaned.indexOf('{')

  const lastBrace =
    cleaned.lastIndexOf('}')

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <= firstBrace
  ) {
    throw new Error(
      'Roleplay interpreter did not return valid JSON.',
    )
  }

  return JSON.parse(
    cleaned.slice(
      firstBrace,
      lastBrace + 1,
    ),
  )
}

function formatRecentHistory(
  conversationHistory:
    ConversationHistoryMessage[],

  characterName:
    string,
) {
  const recent =
    conversationHistory
      .slice(-6)

  if (
    recent.length === 0
  ) {
    return 'No recent conversation.'
  }

  return recent
    .map(
      (message) => {
        const speaker =
          message.sender ===
          'user'
            ? 'USER'
            : characterName
                .toUpperCase()

        return `${speaker}: ${message.text}`
      },
    )
    .join('\n')
}

function buildInterpreterPrompt({
  context,
  characterName,
  userMessage,
  conversationHistory,
}: RoleplayInterpreterArgs) {
  return `
You are the roleplay interpretation layer for VelvetVerse.

Your job is NOT to write dialogue.

Your job is to determine what the user's latest roleplay message actually contains.

Interpret meaning from context rather than relying on keywords.

CHARACTER

Name:
${characterName}

Current known character location:
${context.brain.identity.homeland}

RECENT CONVERSATION

${formatRecentHistory(
  conversationHistory,
  characterName,
)}

LATEST USER MESSAGE

${userMessage}

CLASSIFY THE MESSAGE

Separate the message into these categories:

spokenDialogue:
Words the user intentionally speaks aloud so that ${characterName} could hear them if physically present.

userActions:
Physical actions performed by the user.

userThoughts:
Private thoughts, fantasies, intentions, memories, or internal monologue belonging to the user.

observations:
Things the user notices, watches, sees, hears, or studies.

narration:
General narrative information that does not clearly belong to another category.

movement:
Determine whether the user physically changes location.

changesLocation:
true only when the user actually moves to another location.

targetLocation:
the destination if reasonably identifiable, otherwise null.

leavesCharacter:
true when the user's movement means they leave ${characterName}'s immediate presence.

approachesCharacter:
true when the user moves toward or joins ${characterName}.

claims:
Identify statements where the user attempts to establish something about ${characterName} or the world that the user should not automatically control.

Claim types:

character_action:
The user narrates an action performed by ${characterName}.

character_feeling:
The user declares what ${characterName} feels.

character_thought:
The user declares what ${characterName} thinks.

character_memory:
The user declares or changes ${characterName}'s memories.

world_effect:
The user declares a magical, technological, supernatural, chemical, or other external effect as automatically true.

relationship_state:
The user declares that ${characterName} now loves, trusts, desires, obeys, belongs to, or otherwise has a relationship state toward the user.

unknown:
A claim exists but does not fit another category.

IMPORTANT AGENCY RULE

The user has authority over:
- their own speech
- their own actions
- their own thoughts
- their own intentions

The user does NOT automatically have authority over:
- ${characterName}'s thoughts
- ${characterName}'s feelings
- ${characterName}'s actions
- ${characterName}'s memories
- ${characterName}'s attraction
- ${characterName}'s consent
- relationship progression
- unexplained world-changing effects

Do NOT decide whether a claim succeeds.

Only identify that a claim was made.

IMPORTANT PERCEPTION RULE

Private user thoughts are not spoken dialogue.

If the user thinks something silently, ${characterName} does not automatically know it.

An observation by the user is not automatically something ${characterName} notices.

Movement can change whether the user and ${characterName} remain physically together.

EXAMPLES OF MEANING

If the user retires to another room and privately thinks about ${characterName}, classify the movement and private thought separately.

If the user watches ${characterName} while remaining silent, classify it as an observation or action, not spoken dialogue.

If the user narrates that a necklace secretly changes ${characterName}'s feelings, classify it as a world-effect claim. Do not treat the claimed effect as automatically true.

Return ONLY JSON.

Use exactly this structure:

{
  "spokenDialogue": [],
  "userActions": [],
  "userThoughts": [],
  "observations": [],
  "narration": [],
  "movement": {
    "changesLocation": false,
    "targetLocation": null,
    "leavesCharacter": false,
    "approachesCharacter": false
  },
  "claims": []
}
`.trim()
}

export async function interpretRoleplay({
  signal,
  context,
  characterName,
  userMessage,
  conversationHistory,
}: RoleplayInterpreterArgs):
Promise<RoleplayInterpretation> {
  const prompt =
    buildInterpreterPrompt({
      context,
      characterName,
      userMessage,
      conversationHistory,
    })

  try {
    const data =
      await fetchModelJson(
        OLLAMA_URL,
        {
          method:
            'POST',

          signal,

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

              format:
                'json',

              messages: [
                {
                  role:
                    'system',

                  content:
                    prompt,
                },

                {
                  role:
                    'user',

                  content:
                    userMessage,
                },
              ],

              options: {
                temperature:
                  0.1,

                top_p:
                  0.75,
              },
            }),
        },
      )

    if (
      typeof data !==
        'object' ||
      data === null
    ) {
      throw new Error(
        'Roleplay interpreter returned an invalid response.',
      )
    }

    const ollamaResponse =
      data as OllamaChatResponse

    const content =
      ollamaResponse.message
        ?.content
        ?.trim()

    if (!content) {
      throw new Error(
        'Roleplay interpreter returned an empty response.',
      )
    }

    const parsed =
      extractJson(
        content,
      )

    const interpretation =
      normalizeInterpretation(
        parsed,
      )

    console.log(
      '[VelvetVerse Roleplay Interpretation]',
      {
        character:
          characterName,

        message:
          userMessage,

        interpretation,
      },
    )

    return interpretation
  } catch (error) {
    console.warn(
      '[VelvetVerse Roleplay Interpretation] Failed.',
      error,
    )

    throw error
  }
}
