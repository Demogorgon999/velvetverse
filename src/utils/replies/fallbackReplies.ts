import type { ReplyHandler } from './types'
import { createReply } from './replyFactory'

export const getFallbackReply: ReplyHandler = ({
  context,
  characterName,
}) => {
  const { mood } = context

  switch (mood.mood) {
    case 'Playful':
      return createReply(
        `${characterName} smiles mischievously. "Interesting. Do continue."`,
        {
          emotion: 'Playful',
          animation: 'smile',
          internalThought:
            'Perhaps I can tease a little more.',
        },
      )

    case 'Affectionate':
      return createReply(
        `${characterName}'s expression softens. "Tell me more. I enjoy listening to you."`,
        {
          emotion: 'Affectionate',
          animation: 'smile',
          relationshipDelta: 1,
          internalThought:
            'I enjoy the sound of their thoughts.',
        },
      )

    case 'Protective':
      return createReply(
        `${characterName} watches you with concern. "I am listening. You are safe here."`,
        {
          emotion: 'Protective',
          animation: 'concern',
          internalThought:
            'I need to make sure they feel safe.',
        },
      )

    case 'Curious':
      return createReply(
        `${characterName} leans closer. "That raises several questions."`,
        {
          emotion: 'Curious',
          animation: 'thinking',
          internalThought:
            'There is more behind those words.',
        },
      )

    case 'Irritated':
      return createReply(
        `${characterName}'s expression tightens. "Choose your next words carefully."`,
        {
          emotion: 'Irritated',
          animation: 'idle',
          relationshipDelta: -1,
          internalThought:
            'My patience is beginning to fade.',
        },
      )

    case 'Suspicious':
      return createReply(
        `${characterName} studies you closely. "Why do you ask?"`,
        {
          emotion: 'Suspicious',
          animation: 'thinking',
          internalThought:
            'Their intentions are not yet clear.',
        },
      )

    case 'Sad':
      return createReply(
        `${characterName} looks away for a moment. "Today is not an easy day for me."`,
        {
          emotion: 'Sad',
          animation: 'concern',
          typingDelay: 2400,
          internalThought:
            'I do not want them to see how heavily this weighs on me.',
        },
      )

    case 'Calm':
    default:
      return createReply(
        `${characterName} regards you thoughtfully. "Please continue."`,
        {
          emotion: 'Neutral',
          animation: 'idle',
        },
      )
  }
}