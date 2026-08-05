import type { CharacterEngineContext } from './characterEngine'
import type {
  CharacterEmotion,
  CharacterReply,
  ReplyAnimation,
} from '../types/reply'

type ReplyOptions = {
  emotion?: CharacterEmotion
  animation?: ReplyAnimation
  typingDelay?: number
  relationshipDelta?: number
  moodDelta?: number
  internalThought?: string
}

function calculateTypingDelay(text: string) {
  const estimatedDelay = 900 + text.length * 12

  return Math.max(
    1100,
    Math.min(3600, estimatedDelay),
  )
}

function createReply(
  text: string,
  options: ReplyOptions = {},
): CharacterReply {
  return {
    text,
    emotion: options.emotion ?? 'Neutral',
    animation: options.animation ?? 'idle',
    typingDelay:
      options.typingDelay ??
      calculateTypingDelay(text),
    relationshipDelta:
      options.relationshipDelta ?? 0,
    moodDelta: options.moodDelta ?? 0,
    internalThought: options.internalThought,
  }
}

export function getCharacterReply(
  context: CharacterEngineContext,
  characterName: string,
  userMessage: string,
): CharacterReply {
  const lower = userMessage.toLowerCase()

  const {
    memory,
    mood,
    relationshipStage,
    brain,
  } = context

  const isGreeting =
    /\b(hello|hi|hey)\b/i.test(userMessage)

  if (isGreeting) {
    if (memory.userName) {
      return createReply(
        `${characterName} regards you warmly. "Welcome back, ${memory.userName}. It is good to see you again."`,
        {
          emotion: 'Happy',
          animation: 'smile',
          relationshipDelta: 1,
          internalThought:
            'I am genuinely pleased that they returned.',
        },
      )
    }

    return createReply(
      `${characterName} regards you with quiet interest. "Greetings, traveler."`,
      {
        emotion: 'Curious',
        animation: 'idle',
        internalThought:
          'A new conversation begins. I wonder what they want.',
      },
    )
  }

  if (
    lower.includes('thank you') ||
    lower.includes('thanks')
  ) {
    if (mood.mood === 'Affectionate') {
      return createReply(
        `"You never need to thank me," ${characterName} says warmly.`,
        {
          emotion: 'Affectionate',
          animation: 'smile',
          relationshipDelta: 1,
          moodDelta: 1,
          internalThought:
            'Their appreciation means more to me than I expected.',
        },
      )
    }

    return createReply(
      `${characterName} gives a small nod. "You are welcome."`,
      {
        emotion: 'Happy',
        animation: 'smile',
        relationshipDelta: 1,
      },
    )
  }

  if (
    lower.includes('tell me a secret') ||
    lower.includes('what are you hiding') ||
    lower.includes('do you have any secrets') ||
    lower.includes('share a secret with me')
  ) {
    switch (relationshipStage) {
      case 'Hostile':
        return createReply(
          `${characterName} gives you a cold look. "I owe you no secrets."`,
          {
            emotion: 'Irritated',
            animation: 'idle',
            relationshipDelta: -1,
            internalThought:
              'They have not earned the right to ask me that.',
          },
        )

      case 'Stranger':
        return createReply(
          `${characterName} studies you carefully. "We barely know one another."`,
          {
            emotion: 'Suspicious',
            animation: 'thinking',
            internalThought:
              'They are asking for trust before earning it.',
          },
        )

      case 'Acquaintance':
        return createReply(
          `${characterName} lowers her voice slightly. "Perhaps when trust has had time to grow."`,
          {
            emotion: 'Suspicious',
            animation: 'thinking',
          },
        )

      case 'Friend':
      case 'Close Friend':
        return createReply(
          `${characterName} hesitates. "Perhaps... but not today."`,
          {
            emotion: 'Curious',
            animation: 'thinking',
            internalThought:
              'I trust them more than before, but not completely.',
          },
        )

      case 'Trusted':
      case 'Best Friend':
      case 'Soulmate': {
        const secret =
          brain.secrets.length > 0
            ? brain.secrets[
                Math.floor(
                  Math.random() *
                    brain.secrets.length,
                )
              ]
            : undefined

        if (secret) {
          return createReply(
            `${characterName} lowers her voice. "${secret}"`,
            {
              emotion: 'Affectionate',
              animation: 'thinking',
              relationshipDelta: 1,
              typingDelay: 2600,
              internalThought:
                'I trust them enough to reveal something real.',
            },
          )
        }

        return createReply(
          `${characterName} gives a faint smile. "There are things I have never told another soul."`,
          {
            emotion: 'Affectionate',
            animation: 'smile',
            internalThought:
              'Some truths are still difficult to speak aloud.',
          },
        )
      }
    }
  }

  if (
    lower.includes('how old are you') ||
    lower.includes('what is your age') ||
    lower.includes("what's your age") ||
    lower.includes('how long have you been alive') ||
    lower.includes(
      'how long have you been a vampire',
    )
  ) {
    return createReply(
      `${characterName} answers calmly. "I am ${brain.identity.age}."`,
    )
  }

  if (
    lower.includes('what are you') ||
    lower.includes('what species are you') ||
    lower.includes('are you human')
  ) {
    return createReply(
      `${characterName} meets your gaze. "I am ${brain.identity.species}."`,
    )
  }

  if (
    lower.includes('where are you from') ||
    lower.includes('where do you come from') ||
    lower.includes('what is your homeland') ||
    lower.includes("what's your homeland")
  ) {
    return createReply(
      `${characterName} replies, "I come from ${brain.identity.homeland}."`,
    )
  }

  if (
    lower.includes('what do you do') ||
    lower.includes('what is your role') ||
    lower.includes("what's your role") ||
    lower.includes('who are you really')
  ) {
    return createReply(
      `${characterName} answers, "I am ${brain.identity.role}."`,
    )
  }

  if (
    lower.includes('tell me about your past') ||
    lower.includes('tell me your story') ||
    lower.includes('what happened to you') ||
    lower.includes('tell me about your history')
  ) {
    return createReply(
      `${characterName} grows thoughtful. "${brain.lore.join(
        ' ',
      )}"`,
      {
        emotion: 'Sad',
        animation: 'thinking',
        typingDelay: 3200,
        internalThought:
          'The past is never as distant as I pretend.',
      },
    )
  }

  if (
    lower.includes('what do you know') ||
    lower.includes(
      'what are you knowledgeable about',
    ) ||
    lower.includes('what can you teach me') ||
    lower.includes('what subjects do you know')
  ) {
    return createReply(
      `${characterName} replies, "I know much about ${brain.knowledge.join(
        ', ',
      )}."`,
      {
        emotion: 'Curious',
        animation: 'thinking',
      },
    )
  }

  if (
    lower.includes('what are you afraid of') ||
    lower.includes('what do you fear') ||
    lower.includes('what scares you')
  ) {
    return createReply(
      `${characterName} hesitates before answering. "I fear ${brain.fears.join(
        ', ',
      )}."`,
      {
        emotion: 'Concerned',
        animation: 'concern',
        typingDelay: 2600,
        internalThought:
          'Admitting fear makes me feel exposed.',
      },
    )
  }

  if (
    lower.includes('what do you want') ||
    lower.includes('what is your goal') ||
    lower.includes("what's your goal") ||
    lower.includes('what are your goals') ||
    lower.includes('what is your purpose')
  ) {
    return createReply(
      `${characterName} replies, "My ambitions are to ${brain.motivations.join(
        ', ',
      )}."`,
      {
        emotion: 'Curious',
        animation: 'thinking',
      },
    )
  }

  if (
    lower.includes('what is my name') ||
    lower.includes("what's my name") ||
    lower.includes('do you remember my name')
  ) {
    if (memory.userName) {
      return createReply(
        `${characterName} smiles softly. "Your name is ${memory.userName}. I remember."`,
        {
          emotion: 'Happy',
          animation: 'smile',
          relationshipDelta: 1,
          internalThought:
            'Of course I remember their name.',
        },
      )
    }

    return createReply(
      `${characterName} tilts her head. "You have not told me your name yet."`,
      {
        emotion: 'Curious',
        animation: 'thinking',
      },
    )
  }

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
      )
  }
}