import type {
  CharacterEngineContext,
} from '../utils/characterEngine'

import type {
  ConversationHistoryMessage,
} from '../utils/replies/types'

import type {
  InteractionAssessment,
} from '../utils/interactionAssessment'

import { fetchModelJson } from '../../shared/fetchModelJson'


type AssessInteractionOptions = {
  signal?: AbortSignal
  context:
    CharacterEngineContext

  characterName:
    string

  /*
   * Original user message is retained
   * only for logging/debugging.
   *
   * It is NOT automatically supplied
   * to the semantic evaluator.
   */
  userMessage:
    string

  /*
   * This is the only material the
   * character actually perceived.
   *
   * Examples:
   *
   * spoken dialogue heard by character
   * visible user actions
   *
   * Private thoughts must NOT appear here.
   */
  perceivedInteraction:
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


function createEmptyAssessment():
InteractionAssessment {
  return {
    supportive: 0,
    respectful: 0,
    flirtatious: 0,
    romantic: 0,
    vulnerable: 0,
    loyal: 0,
    playful: 0,
    socialInvitation: 0,

    rude: 0,
    pressuring: 0,
    dishonest: 0,
    hostile: 0,
  }
}


function clampSignal(
  value: unknown,
): number {
  if (
    typeof value !==
      'number' ||
    !Number.isFinite(
      value,
    )
  ) {
    return 0
  }

  return Math.max(
    0,
    Math.min(
      1,
      value,
    ),
  )
}


function normalizeAssessment(
  value: unknown,
): InteractionAssessment {
  if (
    typeof value !==
      'object' ||
    value === null
  ) {
    return createEmptyAssessment()
  }

  const assessment =
    value as Record<
      string,
      unknown
    >

  return {
    supportive:
      clampSignal(
        assessment.supportive,
      ),

    respectful:
      clampSignal(
        assessment.respectful,
      ),

    flirtatious:
      clampSignal(
        assessment.flirtatious,
      ),

    romantic:
      clampSignal(
        assessment.romantic,
      ),

    vulnerable:
      clampSignal(
        assessment.vulnerable,
      ),

    loyal:
      clampSignal(
        assessment.loyal,
      ),

    playful:
      clampSignal(
        assessment.playful,
      ),

    socialInvitation:
      clampSignal(
        assessment.socialInvitation,
      ),

    rude:
      clampSignal(
        assessment.rude,
      ),

    pressuring:
      clampSignal(
        assessment.pressuring,
      ),

    dishonest:
      clampSignal(
        assessment.dishonest,
      ),

    hostile:
      clampSignal(
        assessment.hostile,
      ),
  }
}


function formatConversationHistory(
  conversationHistory:
    ConversationHistoryMessage[],

  characterName:
    string,
) {
  const recentHistory =
    conversationHistory
      .slice(-8)

  if (
    recentHistory.length === 0
  ) {
    return 'No previous conversation.'
  }

  return recentHistory
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


function buildAssessmentPrompt({
  context,
  characterName,
  perceivedInteraction,
  conversationHistory,
}: AssessInteractionOptions) {
  const history =
    formatConversationHistory(
      conversationHistory,
      characterName,
    )

  return `
You are a semantic interaction evaluator for a fictional character relationship system.

Your job is NOT to write dialogue.

Your job is to evaluate ONLY what ${characterName} actually perceived from the user's latest interaction.

Do not evaluate private thoughts, unseen actions, remote activity, hidden narration, fantasies, intentions, or other information that ${characterName} could not perceive.

The supplied PERCEIVED INTERACTION is the source of truth.

Do not infer additional user behaviour from information outside it.

Do not score messages by searching for magic words or exact phrases.

Interpret:
- context
- tone
- intention expressed through perceivable behaviour
- implications
- conversational continuity
- emotional meaning
- whether perceivable behaviour respects or violates boundaries

A short interaction may only make sense because of what was said immediately before it.

CHARACTER

Name:
${characterName}

Current relationship stage:
${context.relationshipStage}

Character personality:
${context.personality.traits.join(', ')}

Character tone:
${context.personality.tone}

Current mood:
${context.mood.mood}

RECENT CONVERSATION

${history}

LATEST PERCEIVED INTERACTION

${perceivedInteraction}

IMPORTANT PERCEPTION RULE

Evaluate only the material under LATEST PERCEIVED INTERACTION.

If the user privately thinks something flattering, romantic, insulting, sexual, hostile, supportive, or otherwise emotional but ${characterName} did not perceive it, it must contribute ZERO relationship signal.

If the user performs an action that ${characterName} can visibly observe, that action may be evaluated.

If the user says something aloud that ${characterName} can hear, that speech may be evaluated.

If nothing meaningful was perceived, all scores should be zero.

ASSESS THE PERCEIVED INTERACTION

Return numbers between 0 and 1.

supportive:
How much emotional support, reassurance, care, patience, or encouragement was actually perceived?

respectful:
How much respect, consideration, consent awareness, patience, or boundary respect was actually perceived?

flirtatious:
How much perceivable teasing attraction, charm, suggestiveness, admiration, or flirting occurred?

romantic:
How much perceivable genuine romantic interest, emotional courtship, attachment, or desire for emotional partnership occurred?

vulnerable:
How much genuine personal vulnerability or emotional openness was actually communicated to the character?

loyal:
How much commitment, reliability, protection, devotion, or willingness to stand by the character was actually communicated?

playful:
How much joking, teasing, playful challenge, mischievousness, or light-hearted interaction was actually perceived?

socialInvitation:
How strongly did the user actually invite the character to spend time together or share an activity?

rude:
How insulting, dismissive, disrespectful, or degrading was the perceived interaction?

pressuring:
How coercive, demanding, manipulative, possessive, boundary-pushing, or emotionally pressuring was the perceived interaction?

dishonest:
How strongly does the perceived interaction indicate deception or deliberate dishonesty?

hostile:
How threatening, hateful, aggressive, or openly antagonistic was the perceived interaction?

IMPORTANT

A perceived interaction may contain both positive and negative signals.

Do not automatically treat romantic or flirtatious behaviour as positive.

Do not automatically treat disagreement as rude or hostile.

Do not mistake boundary respect for pressure.

Do not infer major emotional significance from ordinary interaction.

Repeated compliments may still be recognised semantically; diminishing relationship returns are handled elsewhere.

You are assessing WHAT THE CHARACTER ACTUALLY EXPERIENCED socially and emotionally.

You are NOT deciding how much the relationship should change.

Return ONLY valid JSON.

Use exactly this structure:

{
  "supportive": 0,
  "respectful": 0,
  "flirtatious": 0,
  "romantic": 0,
  "vulnerable": 0,
  "loyal": 0,
  "playful": 0,
  "socialInvitation": 0,
  "rude": 0,
  "pressuring": 0,
  "dishonest": 0,
  "hostile": 0
}
`.trim()
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
    cleaned.indexOf(
      '{',
    )

  const lastBrace =
    cleaned.lastIndexOf(
      '}',
    )

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <= firstBrace
  ) {
    throw new Error(
      'Interaction evaluator did not return JSON.',
    )
  }

  return JSON.parse(
    cleaned.slice(
      firstBrace,
      lastBrace + 1,
    ),
  )
}


export async function assessInteractionSemantically({
  signal,
  context,
  characterName,
  userMessage,
  perceivedInteraction,
  conversationHistory,
}: AssessInteractionOptions):
Promise<InteractionAssessment> {
  const perceived =
    perceivedInteraction
      .trim()

  /*
   * ================================================================
   * NOTHING PERCEIVED
   * ================================================================
   *
   * Do not even call Ollama.
   *
   * If the character did not perceive
   * anything socially meaningful, there
   * can be no relationship signal.
   */

  if (!perceived) {
    const emptyAssessment =
      createEmptyAssessment()

    console.log(
      '[VelvetVerse Semantic Assessment]',
      {
        character:
          characterName,

        originalMessage:
          userMessage,

        perceivedInteraction:
          '',

        skipped:
          true,

        reason:
          'The character perceived no relationship-relevant interaction.',

        assessment:
          emptyAssessment,
      },
    )

    return emptyAssessment
  }


  const prompt =
    buildAssessmentPrompt({
      context,

      characterName,

      userMessage,

      perceivedInteraction:
        perceived,

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

                  /*
                   * IMPORTANT:
                   *
                   * Send ONLY what the character
                   * perceived.
                   *
                   * The raw user message is never
                   * sent here as interaction data.
                   */
                  content:
                    perceived,
                },
              ],

              options: {
                temperature:
                  0.15,

                top_p:
                  0.8,
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
        'Interaction evaluator returned an invalid response.',
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
        'Interaction evaluator returned an empty response.',
      )
    }


    const parsed =
      extractJson(
        content,
      )


    const assessment =
      normalizeAssessment(
        parsed,
      )


    console.log(
      '[VelvetVerse Semantic Assessment]',
      {
        character:
          characterName,

        originalMessage:
          userMessage,

        perceivedInteraction:
          perceived,

        skipped:
          false,

        assessment,
      },
    )


    return assessment
  } catch (error) {
    console.warn(
      '[VelvetVerse Semantic Assessment] Failed.',
      error,
    )

    throw error
  }
}
