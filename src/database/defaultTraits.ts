import type {
  CharacterIdentity,
  PersonalityTraits,
  SpeakingStyle,
} from '../types/characterTemplate'

export const defaultIdentity: CharacterIdentity = {
  species: '',
  age: '',
  role: '',
  homeland: '',
}

export const defaultPersonality: PersonalityTraits = {
  kindness: 50,
  curiosity: 50,
  bravery: 50,
  patience: 50,
  confidence: 50,
  humour: 50,
  jealousy: 50,
  loyalty: 50,
  intelligence: 50,
  empathy: 50,
}

export const defaultSpeakingStyle: SpeakingStyle = {
  formality: 50,
  poetic: 50,
  sarcasm: 50,
  flirtiness: 50,
  swearing: 0,
  emojiUsage: 0,
}

export function createDefaultIdentity(): CharacterIdentity {
  return {
    ...defaultIdentity,
  }
}

export function createDefaultPersonality(): PersonalityTraits {
  return {
    ...defaultPersonality,
  }
}

export function createDefaultSpeakingStyle(): SpeakingStyle {
  return {
    ...defaultSpeakingStyle,
  }
}