export type CharacterScoreInput = {
  name: string
  title: string
  description: string
  greeting: string
  personality: string
  world: string
  imagePreview: string
  voice: string
  memoryEnabled: boolean
}

export type CharacterScoreResult = {
  completionScore: number
  qualityScore: number
  discoverability: 'Low' | 'Moderate' | 'High'
  estimatedFollowers: number
  estimatedPremiumSubscribers: number
  estimatedMonthlyEarnings: number
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(Math.max(value, minimum), maximum)
}

export function calculateCharacterScore(
  character: CharacterScoreInput,
): CharacterScoreResult {
  const completedItems = [
    Boolean(character.name.trim()),
    Boolean(character.title.trim()),
    Boolean(character.description.trim()),
    Boolean(character.greeting.trim()),
    Boolean(character.personality.trim()),
    Boolean(character.world.trim()),
    Boolean(character.imagePreview),
  ]

  const completionScore = Math.round(
    (completedItems.filter(Boolean).length /
      completedItems.length) *
      100,
  )

  let qualityPoints = 0

  if (character.name.trim().length >= 3) {
    qualityPoints += 10
  }

  if (character.title.trim().length >= 3) {
    qualityPoints += 8
  }

  if (character.description.trim().length >= 50) {
    qualityPoints += 14
  } else if (character.description.trim().length >= 20) {
    qualityPoints += 8
  }

  if (character.greeting.trim().length >= 80) {
    qualityPoints += 16
  } else if (character.greeting.trim().length >= 30) {
    qualityPoints += 9
  }

  if (character.personality.trim().length >= 150) {
    qualityPoints += 22
  } else if (character.personality.trim().length >= 60) {
    qualityPoints += 12
  }

  if (character.world.trim().length >= 150) {
    qualityPoints += 18
  } else if (character.world.trim().length >= 60) {
    qualityPoints += 10
  }

  if (character.imagePreview) {
    qualityPoints += 8
  }

  if (character.voice.trim()) {
    qualityPoints += 4
  }

  if (character.memoryEnabled) {
    qualityPoints += 4
  }

  const qualityScore = clamp(qualityPoints, 0, 100)

  let discoverability:
    CharacterScoreResult['discoverability'] = 'Low'

  if (qualityScore >= 80) {
    discoverability = 'High'
  } else if (qualityScore >= 50) {
    discoverability = 'Moderate'
  }

  const estimatedFollowers = Math.round(
    qualityScore * qualityScore * 1.5,
  )

  const estimatedPremiumSubscribers = Math.round(
    estimatedFollowers * 0.12,
  )

  const estimatedMonthlyEarnings =
    estimatedPremiumSubscribers * 2

  return {
    completionScore,
    qualityScore,
    discoverability,
    estimatedFollowers,
    estimatedPremiumSubscribers,
    estimatedMonthlyEarnings,
  }
}