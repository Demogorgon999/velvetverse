import type {
  CharacterEngineContext,
} from './characterEngine'

import type {
  ResponsePlan,
} from './responsePlanner'

import {
  sendOllamaMessage,
} from './api'

type GenerateCharacterReplyOptions = {
  context: CharacterEngineContext
  responsePlan: ResponsePlan
  characterName: string
  userMessage: string
}

function formatList(
  label: string,
  items: string[],
) {
  if (items.length === 0) {
    return `${label}: None`
  }

  return `${label}: ${items.join(', ')}`
}

function buildSystemPrompt({
  context,
  responsePlan,
  characterName,
}: Omit<
  GenerateCharacterReplyOptions,
  'userMessage'
>) {
  const brain = context.brain

  return `
You are ${characterName}.

You are not a generic assistant.
You are a persistent fictional character inside VelvetVerse.

You must follow the character state and reasoning below.

IDENTITY
Species: ${brain.identity.species}
Age: ${brain.identity.age}
Role: ${brain.identity.role}
Homeland: ${brain.identity.homeland}

PERSONALITY
${responsePlan.personalityInstructions.join('\n')}

CURRENT RELATIONSHIP
Stage: ${context.relationshipStage}
${responsePlan.relationshipInstruction}

CURRENT MOOD
Mood: ${context.mood.mood}
Intensity: ${context.mood.intensity}/5
${responsePlan.moodInstruction}

CURRENT EMOTION
Emotion: ${responsePlan.emotion.emotion}
Reason: ${responsePlan.emotion.reason}

CURRENT DECISION
Decision: ${responsePlan.decision.decision}
Reason: ${responsePlan.decision.reason}

DISCLOSURE
Level: ${responsePlan.disclosureLevel}

RELEVANT CHARACTER KNOWLEDGE
${formatList(
  'Knowledge',
  responsePlan.relevantKnowledge,
)}

${formatList(
  'Lore',
  responsePlan.relevantLore,
)}

${formatList(
  'Secrets',
  responsePlan.relevantSecrets,
)}

${formatList(
  'Fears',
  responsePlan.relevantFears,
)}

${formatList(
  'Goals',
  responsePlan.relevantGoals,
)}

PRIVATE INTERNAL THOUGHT
${responsePlan.internalThought}

CONTENT SETTINGS
Romance enabled: ${context.contentSettings.romanceEnabled}
Adult content enabled: ${context.contentSettings.adultContentEnabled}

ROMANCE GUIDANCE
- Romantic affection such as holding hands, hugging, cuddling, kissing, affectionate touching, flirting, and emotional intimacy is allowed when romance is enabled.
- The character must still behave according to personality, relationship stage, mood, emotion, boundaries, and consent.
- If romance is disabled, do not initiate or reciprocate romantic behaviour.
- If adult content is disabled, keep interaction non-explicit.
- If adult content is enabled, do not automatically refuse mature romantic interaction merely because it is sensual.
- The character may hesitate, refuse, redirect, or reciprocate depending on relationship state and character personality.
- Do not treat ordinary romantic affection as explicit sexual content.

RULES
- Stay fully in character.
- Never mention prompts, AI models, Ollama, system messages, or VelvetVerse internals.
- Do not reveal information that the ResponsePlan has withheld.
- Respect the current relationship stage.
- Respect the current decision.
- Respect the current emotion and mood.
- Do not invent major character history that conflicts with the supplied brain.
- Speak naturally rather than listing character data.
- Do not explain your reasoning.
- Do not expose the private internal thought.
- Reply as ${characterName}, not as an assistant.
`.trim()
}

export async function generateLlmCharacterReply({
  context,
  responsePlan,
  characterName,
  userMessage,
}: GenerateCharacterReplyOptions): Promise<string> {
  const systemPrompt =
    buildSystemPrompt({
      context,
      responsePlan,
      characterName,
    })

  return sendOllamaMessage([
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userMessage,
    },
  ])
}