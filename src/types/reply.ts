export type CharacterEmotion =
  | 'Neutral'
  | 'Happy'
  | 'Concerned'
  | 'Curious'
  | 'Playful'
  | 'Affectionate'
  | 'Protective'
  | 'Suspicious'
  | 'Sad'
  | 'Irritated'

export type ReplyAnimation =
  | 'idle'
  | 'smile'
  | 'laugh'
  | 'thinking'
  | 'concern'
  | 'surprised'

export type CharacterReply = {
  text: string

  emotion: CharacterEmotion

  animation: ReplyAnimation

  typingDelay: number

  relationshipDelta: number

  moodDelta: number

  internalThought?: string
}