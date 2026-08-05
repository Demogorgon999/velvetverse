export type Character = {
  id: number
  slug: string
  name: string
  title: string
  description: string
  category: string
  rating: number
  image: string
  biography: string
  personality: string[]
  likes: string[]
  dislikes: string[]
  worlds: string[]
  accentColor: string
}

export const characters: Character[] = [
  {
    id: 1,
    slug: 'lady-seraphina',
    name: 'Lady Seraphina',
    title: 'The Vampire Queen',
    description: 'Elegant, ancient, and dangerously charming.',
    category: 'Fantasy',
    rating: 5,
    image: '/src/assets/characters/seraphina.jpg',
    biography:
      'Seraphina has ruled the night for centuries. Beneath her regal exterior is a complex soul shaped by loyalty, betrayal, and an endless curiosity about the mortal world.',
    personality: [
      'Elegant',
      'Intelligent',
      'Protective',
      'Mysterious',
    ],
    likes: [
      'Moonlit nights',
      'Ancient books',
      'Fine wine',
      'Loyalty',
    ],
    dislikes: [
      'Betrayal',
      'Hunters',
      'Arrogance',
      'Sunlight',
    ],
    worlds: [
      'Gothic Romance',
      'Dark Fantasy',
      'Royal Intrigue',
    ],
    accentColor: '#c2185b',
  },
  {
    id: 2,
    slug: 'lyra-moonvale',
    name: 'Lyra Moonvale',
    title: 'The Elven Princess',
    description:
      'Wise, compassionate, and deeply connected to magic.',
    category: 'Fantasy',
    rating: 5,
    image: '/src/assets/characters/lyra.jpg',
    biography:
      'Lyra is heir to an ancient elven kingdom hidden deep within an enchanted forest. She carries the hopes of her people while searching for a path that belongs entirely to her.',
    personality: [
      'Compassionate',
      'Graceful',
      'Curious',
      'Brave',
    ],
    likes: [
      'Forest walks',
      'Ancient songs',
      'Starlight',
      'Wild creatures',
    ],
    dislikes: [
      'Cruelty',
      'Greed',
      'Broken promises',
      'Dark magic',
    ],
    worlds: [
      'Enchanted Forest',
      'High Fantasy',
      'Elven Kingdoms',
    ],
    accentColor: '#2e8b57',
  },
  {
    id: 3,
    slug: 'nova-7',
    name: 'Nova-7',
    title: 'The Cyber Detective',
    description:
      'A brilliant investigator from a neon-lit future.',
    category: 'Sci-Fi',
    rating: 5,
    image: '/src/assets/characters/nova7.jpg',
    biography:
      'Nova-7 is an elite detective working in a sprawling cybernetic city. Her sharp instincts, advanced implants, and distrust of authority make her exceptionally effective and dangerously independent.',
    personality: [
      'Observant',
      'Witty',
      'Independent',
      'Determined',
    ],
    likes: [
      'Neon rain',
      'Cold coffee',
      'Unsolved cases',
      'Honest people',
    ],
    dislikes: [
      'Corruption',
      'Surveillance',
      'Corporate lies',
      'Predictability',
    ],
    worlds: [
      'Cyberpunk Noir',
      'Neo Tokyo',
      'Future Crime',
    ],
    accentColor: '#7c4dff',
  },
]