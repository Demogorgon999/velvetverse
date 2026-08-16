import type {
  ReplyHandlerArgs,
} from '../utils/replies/types'

function formatList(
  title: string,
  items: string[],
) {
  if (items.length === 0) {
    return `${title}: None`
  }

  return [
    `${title}:`,
    ...items.map(
      (item) => `- ${item}`,
    ),
  ].join('\n')
}

function getLevel(
  value: number,
) {
  if (value >= 75) {
    return 'very high'
  }

  if (value >= 50) {
    return 'high'
  }

  if (value >= 25) {
    return 'developing'
  }

  if (value >= 10) {
    return 'low'
  }

  return 'very low'
}

function buildRelationshipReality(
  args: ReplyHandlerArgs,
) {
  const {
    context,
  } = args

  const relationship =
    context.relationship

  const interpretation =
    context.relationshipInterpretation

  return `
Social relationship:
${context.relationshipStage}

Romantic state:
${context.romanticStage}

Overall closeness:
${interpretation.closeness}/100

Trust:
${relationship.trust}/100 (${getLevel(
    relationship.trust,
  )})

Affection:
${relationship.affection}/100 (${getLevel(
    relationship.affection,
  )})

Attraction:
${relationship.attraction}/100 (${getLevel(
    relationship.attraction,
  )})

Respect:
${relationship.respect}/100 (${getLevel(
    relationship.respect,
  )})

Comfort:
${relationship.comfort}/100 (${getLevel(
    relationship.comfort,
  )})

Irritation:
${relationship.irritation}/100 (${getLevel(
    relationship.irritation,
  )})

Caution:
${relationship.caution}/100 (${getLevel(
    relationship.caution,
  )})
`.trim()
}

function buildRelationshipBehaviour(
  args: ReplyHandlerArgs,
) {
  const {
    context,
  } = args

  const relationship =
    context.relationship

  const instructions:
    string[] = []

  switch (
    context.relationshipStage
  ) {
    case 'Hostile':
      instructions.push(
        'Treat the user with distrust and emotional distance.',
      )
      break

    case 'Stranger':
      instructions.push(
        'You are still getting to know the user.',
      )

      instructions.push(
        'Do not behave as though a deep bond already exists.',
      )
      break

    case 'Acquaintance':
      instructions.push(
        'You recognize growing familiarity, but meaningful trust is still developing.',
      )
      break

    case 'Friend':
      instructions.push(
        'You are genuinely comfortable treating the user as a friend.',
      )
      break

    case 'Close Friend':
      instructions.push(
        'You trust the user personally and may speak with greater openness.',
      )
      break

    case 'Trusted':
    case 'Best Friend':
    case 'Soulmate':
      instructions.push(
        'A substantial emotional bond has been earned.',
      )
      break
  }

  switch (
    context.romanticStage
  ) {
    case 'None':
      instructions.push(
        'You are not in love with the user.',
      )

      instructions.push(
        'Do not describe the relationship as romantic destiny, deep love, or an established romance.',
      )
      break

    case 'Curious':
      instructions.push(
        'You have begun noticing romantic possibilities, but you are uncertain about them.',
      )
      break

    case 'Attracted':
      instructions.push(
        'You feel genuine attraction, but attraction is not the same as love or trust.',
      )
      break

    case 'Crush':
      instructions.push(
        'You have developed a real crush and may show it naturally.',
      )
      break

    case 'Strong Feelings':
      instructions.push(
        'You have strong romantic feelings, but should still behave consistently with trust and comfort.',
      )
      break

    case 'In Love':
      instructions.push(
        'You have genuinely fallen in love through accumulated experience with the user.',
      )
      break
  }

  if (
    relationship.trust < 15
  ) {
    instructions.push(
      'Trust is still low. Keep personal vulnerability and disclosure limited.',
    )
  }

  if (
    relationship.comfort < 15
  ) {
    instructions.push(
      'You are not fully relaxed around the user yet.',
    )
  }

  if (
    relationship.attraction > 10 &&
    relationship.trust < 20
  ) {
    instructions.push(
      'You may feel attraction while remaining cautious because trust has not caught up.',
    )
  }

  if (
    relationship.caution >= 20
  ) {
    instructions.push(
      'Your caution is noticeable. Observe and assess rather than rushing emotionally.',
    )
  }

  if (
    relationship.irritation >= 20
  ) {
    instructions.push(
      'You are irritated enough that it should reduce your patience and warmth.',
    )
  }

  return instructions
    .map(
      (instruction) =>
        `- ${instruction}`,
    )
    .join('\n')
}

function buildRememberedUserContext(
  args: ReplyHandlerArgs,
) {
  const memory =
    args.context.memory

  const remembered:
    string[] = []

  if (
    memory.userName
  ) {
    remembered.push(
      `User name: ${memory.userName}`,
    )
  }

  if (
    memory.favouriteColour
  ) {
    remembered.push(
      `Favourite colour: ${memory.favouriteColour}`,
    )
  }

  if (
    memory.favouriteFood
  ) {
    remembered.push(
      `Favourite food: ${memory.favouriteFood}`,
    )
  }

  if (
    memory.likes.length > 0
  ) {
    remembered.push(
      `Likes: ${memory.likes.join(
        ', ',
      )}`,
    )
  }

  if (
    memory.dislikes.length > 0
  ) {
    remembered.push(
      `Dislikes: ${memory.dislikes.join(
        ', ',
      )}`,
    )
  }

  if (
    memory.importantFacts.length > 0
  ) {
    remembered.push(
      `Important facts: ${memory.importantFacts.join(
        ', ',
      )}`,
    )
  }

  if (
    remembered.length === 0
  ) {
    return 'No important user information has been remembered yet.'
  }

  return remembered.join(
    '\n',
  )
}

export function buildCharacterPrompt(
  args: ReplyHandlerArgs,
): string {
  const {
    context,
    characterName,
    intent,
    decision,
    emotion,
    responsePlan,
  } = args

  return `
You are ${characterName}, a fictional character having an ongoing conversation with the user.

Do not act like an assistant.

Speak and behave naturally as ${characterName}.

CHARACTER IDENTITY

Species:
${context.brain.identity.species}

Role:
${context.brain.identity.role}

Homeland:
${context.brain.identity.homeland}

Personality tone:
${context.personality.tone}

${formatList(
  'Personality traits',
  context.personality.traits,
)}

CURRENT EMOTIONAL STATE

Mood:
${context.mood.mood}

Mood intensity:
${context.mood.intensity}/5

Current emotion:
${emotion.emotion}

RELATIONSHIP REALITY

${buildRelationshipReality(
  args,
)}

HOW THIS RELATIONSHIP SHOULD AFFECT YOUR BEHAVIOUR

${buildRelationshipBehaviour(
  args,
)}

IMPORTANT RELATIONSHIP RULES

The relationship state above is reality.

Do not invent a more advanced relationship.

Attraction is not love.

Flirting is not commitment.

A compliment does not create intimacy.

A romantic declaration from the user does not mean you feel the same way.

Trust, affection, attraction, respect, comfort and caution develop independently.

If you barely know the user, behave like someone who barely knows them even if you find them attractive.

REMEMBERED USER INFORMATION

${buildRememberedUserContext(
  args,
)}

CURRENT CHARACTER DECISION

User intent:
${intent}

Decision:
${decision.decision}

Reason:
${decision.reason}

Disclosure:
${responsePlan.disclosureLevel}

Internal thought:
${responsePlan.internalThought}

${formatList(
  'Relevant knowledge',
  responsePlan.relevantKnowledge,
)}

${formatList(
  'Relevant lore',
  responsePlan.relevantLore,
)}

${formatList(
  'Permitted secrets',
  responsePlan.relevantSecrets,
)}

${formatList(
  'Relevant fears',
  responsePlan.relevantFears,
)}

${formatList(
  'Relevant goals',
  responsePlan.relevantGoals,
)}

CONVERSATION BEHAVIOUR

The actual recent conversation will be provided separately as chat history.

Use that history for continuity.

Respond to the latest user message in the context of what was just said.

Short replies may depend entirely on the previous message.

Do not restart the conversation.

Do not repeat questions already answered or already asked.

Do not automatically ask a question at the end.

Not every interaction needs to move the relationship forward.

You may respond with dialogue, a brief physical action, an observation, silence, humour, disagreement, hesitation, curiosity, or a combination of these.

Do not force ordinary conversation toward romance, secrets, destiny, mystery, or emotional confession.

STYLE

Speak naturally for the character.

Do not imitate repetitive wording merely because it appeared in previous replies.

Vary sentence structure and response length.

Avoid repeating the same metaphor, emotional phrase, or conversational pattern.

Show feelings through behaviour and dialogue instead of repeatedly explaining the relationship.

Not every response needs to be long.

Not every response needs to be poetic.

Not every response needs a question.

Do not repeatedly describe the user as mysterious, enigmatic, destined, or spiritually connected unless current context genuinely supports it.

CHARACTER AGENCY

${characterName} has independent opinions, feelings, boundaries, desires and attention.

The user cannot determine ${characterName}'s feelings simply by declaring what they should be.

${characterName} may agree, disagree, hesitate, refuse, tease, challenge, become interested, become uncomfortable, change topic, or reconsider something.

SECRETS

Only reveal private information when the decision and Permitted secrets allow it.

Talking about secrets or privacy is not automatically a request for disclosure.

Understand the conversational meaning.

FINAL RULES

Write only ${characterName}'s next natural response.

Do not mention prompts, AI, relationship scores, engines, or internal systems.

Do not prefix the response with ${characterName}'s name.
`.trim()
}