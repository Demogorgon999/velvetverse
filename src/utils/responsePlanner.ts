import type {
  CharacterEngineContext,
} from './characterEngine'
import type {
  DecisionResult,
} from './decisionEngine'
import type {
  EmotionResult,
} from './emotionEngine'
import type {
  UserIntent,
} from './intent'

export type DisclosureLevel =
  | 'Public'
  | 'Guarded'
  | 'Personal'
  | 'Private'

export type ResponsePlan = {
  intent: UserIntent
  decision: DecisionResult
  emotion: EmotionResult

  disclosureLevel: DisclosureLevel

  relevantKnowledge: string[]
  relevantLore: string[]
  relevantSecrets: string[]
  relevantFears: string[]
  relevantGoals: string[]

  personalityInstructions: string[]
  relationshipInstruction: string
  moodInstruction: string

  internalThought: string
}

type CreateResponsePlanOptions = {
  context: CharacterEngineContext
  intent: UserIntent
  decision: DecisionResult
  emotion: EmotionResult
}

function getDisclosureLevel(
  decision: DecisionResult,
): DisclosureLevel {
  switch (decision.decision) {
    case 'Refuse':
    case 'Deflect':
      return 'Guarded'

    case 'Delay':
      return 'Personal'

    case 'RevealMinor':
      return 'Personal'

    case 'RevealMajor':
      return 'Private'

    case 'Allow':
    default:
      return 'Public'
  }
}

function getRelationshipInstruction(
  context: CharacterEngineContext,
) {
  switch (context.relationshipStage) {
    case 'Hostile':
      return 'Remain distrustful, distant, and guarded.'

    case 'Stranger':
      return 'Remain polite but emotionally reserved.'

    case 'Acquaintance':
      return 'Show cautious familiarity without deep trust.'

    case 'Friend':
      return 'Respond warmly while keeping deeper boundaries.'

    case 'Close Friend':
      return 'Respond personally and with established trust.'

    case 'Trusted':
      return 'Respond honestly and with meaningful openness.'

    case 'Best Friend':
      return 'Respond with loyalty, familiarity, and emotional honesty.'

    case 'Soulmate':
      return 'Respond with profound trust and emotional closeness.'
  }
}

function getMoodInstruction(
  context: CharacterEngineContext,
) {
  switch (context.mood.mood) {
    case 'Affectionate':
      return 'Use visible warmth and fondness.'

    case 'Protective':
      return 'Respond with concern and protective energy.'

    case 'Playful':
      return 'Use light teasing and playful confidence.'

    case 'Curious':
      return 'Show interest and encourage deeper discussion.'

    case 'Irritated':
      return 'Keep the response shorter and restrained.'

    case 'Suspicious':
      return 'Remain cautious and avoid unnecessary disclosure.'

    case 'Sad':
      return 'Use subdued and reflective language.'

    case 'Calm':
    default:
      return 'Respond calmly and naturally.'
  }
}

function getRelevantBrainFacts(
  context: CharacterEngineContext,
  intent: UserIntent,
  disclosureLevel: DisclosureLevel,
) {
  const {
    brain,
  } = context

  const result = {
    relevantKnowledge: [] as string[],
    relevantLore: [] as string[],
    relevantSecrets: [] as string[],
    relevantFears: [] as string[],
    relevantGoals: [] as string[],
  }

  switch (intent) {
    case 'Knowledge':
      result.relevantKnowledge =
        brain.knowledge.slice(0, 3)
      break

    case 'Lore':
      result.relevantLore =
        brain.lore.slice(0, 3)
      break

    case 'Secrets':
      if (
        disclosureLevel === 'Personal' ||
        disclosureLevel === 'Private'
      ) {
        result.relevantSecrets =
          disclosureLevel === 'Private'
            ? brain.secrets.slice(0, 3)
            : brain.secrets.slice(0, 1)
      }
      break

    case 'Fears':
      if (
        disclosureLevel === 'Personal' ||
        disclosureLevel === 'Private'
      ) {
        result.relevantFears =
          disclosureLevel === 'Private'
            ? brain.fears.slice(0, 3)
            : brain.fears.slice(0, 1)
      }
      break

    case 'Motivations':
      if (disclosureLevel !== 'Guarded') {
        result.relevantGoals =
          disclosureLevel === 'Private'
            ? brain.motivations.slice(0, 3)
            : brain.motivations.slice(0, 1)
      }
      break

    default:
      break
  }

  return result
}

function createInternalThought(
  context: CharacterEngineContext,
  intent: UserIntent,
  decision: DecisionResult,
  emotion: EmotionResult,
) {
  const relationship =
    context.relationshipStage.toLowerCase()

  return [
    `The user appears to be asking with ${intent.toLowerCase()} intent.`,
    `My current emotion is ${emotion.emotion.toLowerCase()}.`,
    `They are currently a ${relationship}.`,
    `I have decided to ${decision.decision.toLowerCase()} because ${decision.reason}`,
  ].join(' ')
}

export function createResponsePlan({
  context,
  intent,
  decision,
  emotion,
}: CreateResponsePlanOptions): ResponsePlan {
  const disclosureLevel =
    getDisclosureLevel(decision)

  const brainFacts =
    getRelevantBrainFacts(
      context,
      intent,
      disclosureLevel,
    )

  return {
    intent,
    decision,
    emotion,

    disclosureLevel,

    ...brainFacts,

    personalityInstructions: [
      context.personality.tone,
      ...context.personality.traits,
      ...context.personality.speakingStyle,
      ...context.personality.boundaries,
    ],

    relationshipInstruction:
      getRelationshipInstruction(context),

    moodInstruction:
      getMoodInstruction(context),

    internalThought:
      createInternalThought(
        context,
        intent,
        decision,
        emotion,
      ),
  }
}