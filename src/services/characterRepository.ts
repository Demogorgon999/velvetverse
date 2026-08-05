import { characters } from '../data/characters'
import {
  getCharacters as getCreatorCharacters,
  type SavedCharacter,
} from './characterService'

import type { Character } from '../data/characters'

export type RepositoryCharacter =
  | Character
  | SavedCharacter

export function getBuiltInCharacters(): Character[] {
  return characters
}

export function getCreatorDrafts(): SavedCharacter[] {
  return getCreatorCharacters()
}

export function getAllCharacters(): RepositoryCharacter[] {
  return [
    ...characters,
    ...getCreatorCharacters(),
  ]
}

export function getCharacterById(
  id: number,
): RepositoryCharacter | undefined {
  return getAllCharacters().find(
    (character) => character.id === id,
  )
}