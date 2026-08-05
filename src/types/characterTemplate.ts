export type PersonalityTraits = {
  kindness: number
  curiosity: number
  bravery: number
  patience: number
  confidence: number
  humour: number
  jealousy: number
  loyalty: number
  intelligence: number
  empathy: number
}

export type SpeakingStyle = {
  formality: number
  poetic: number
  sarcasm: number
  flirtiness: number
  swearing: number
  emojiUsage: number
}

export type CharacterIdentity = {
  species: string
  age: string
  role: string
  homeland: string
}

export type CharacterStatus =
  | 'draft'
  | 'published'

export type CharacterTemplate = {
  id: number
  creatorId: string

  name: string
  title: string
  category: string

  identity: CharacterIdentity

  description: string
  biography: string
  greeting: string

  // Existing free-text personality field.
  personality: string

  // New structured personality system.
  personalityTraits: PersonalityTraits
  speakingStyle: SpeakingStyle

  knowledge: string[]
  secrets: string[]
  fears: string[]
  goals: string[]
  likes: string[]
  dislikes: string[]

  world: string
  voice: string

  memoryEnabled: boolean
  romanceEnabled: boolean
  adultContentEnabled: boolean

  visibility: string
  status: CharacterStatus

  image: string
  accentColor: string

  createdAt: string
  updatedAt: string
}