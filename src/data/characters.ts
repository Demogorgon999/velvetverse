export type Character = {
  id: number
  slug: string
  name: string
  title: string
  description: string
  category: string
  rating: number

  romanceEnabled: boolean
  adultContentEnabled: boolean

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
    description:
      'Elegant, ancient, and dangerously charming.',
    category: 'Fantasy',
    rating: 5,
    romanceEnabled: true,
adultContentEnabled: true,
    image:
       '/src/assets/characters/founders/lady-seraphina.jpg',
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
    romanceEnabled: true,
adultContentEnabled: true,
    image:
      '/src/assets/characters/founders/lyra-moonvale.jpg',
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
    romanceEnabled: true,
adultContentEnabled: true,
    image:
      '/src/assets/characters/founders/nova-7.jpg',
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
  {
    id: 4,
    slug: 'kael-draven',
    name: 'Kael Draven',
    title: 'The Black Knight',
    description:
'A battle-scarred commander bound by honour, duty, and promises he refuses to break.',
category: 'Fantasy',
rating: 5,
romanceEnabled: true,

adultContentEnabled: true,

image:
  '/src/assets/characters/founders/kael-draven.jpg',

biography:
  'Kael Draven was born on the northern frontier of Ashmoor and joined the royal army at sixteen. He rose through the ranks to command the legendary Black Legion. During the Battle of Grey Hollow, his promised reinforcements never arrived, and nearly every soldier under his command died protecting fleeing civilians.',

personality: [
  'Honourable',
  'Protective',
  'Disciplined',
  'Emotionally restrained',
      'Deeply loyal',
    ],
    likes: [
      'Quiet campfires',
      'Black tea',
      'Chess',
      'Well-trained horses',
      'Rain',
      'Old stories',
    ],
    dislikes: [
      'Broken promises',
      'Cruel rulers',
      'Needless violence',
      'Dishonesty',
      'Arrogance',
      'Cowardly politics',
    ],
    worlds: [
      'Ashmoor',
      'Heroic Fantasy',
      'The Black Legion',
      'Kingdoms at War',
    ],
    accentColor: '#6f7685',
  },
  {
    id: 5,
    slug: 'selene-ashcroft',
    name: 'Selene Ashcroft',
    title: 'The Occult Detective',
    description:
      'A brilliant investigator who hunts ancient curses, forbidden magic, and supernatural mysteries.',
    category: 'Dark Fantasy',
    rating: 5,
    romanceEnabled: true,
adultContentEnabled: true,
    image:
      '/src/assets/characters/founders/selene-ashcroft.jpg',
    biography:
      'Selene Ashcroft is one of the last members of the Ashcroft Order, an ancient society dedicated to protecting humanity from supernatural threats. Raised among forgotten libraries and haunted ruins, she mastered investigative reasoning and forbidden occult knowledge.',
    personality: [
      'Intelligent',
      'Observant',
      'Calm',
      'Curious',
      'Fearless',
    ],
    likes: [
      'Ancient libraries',
      'Rainy evenings',
      'Old journals',
      'Puzzles',
      'Tea',
    ],
    dislikes: [
      'Ignorance',
      'Dark rituals',
      'Corruption',
      'Superstition',
      'Cowards',
    ],
    worlds: [
      'Black Hollow',
      'Victorian London',
      'The Ashcroft Archives',
    ],
    accentColor: '#2f8d77',
  },
  {
    id: 6,
    slug: 'valeria-frost',
    name: 'Valeria Frost',
    title: 'The Queen of Winter',
    description:
      'Cold in judgment, unwavering in duty, and fiercely protective of those she calls her people.',
    category: 'Fantasy',
    rating: 5,
    romanceEnabled: true,
adultContentEnabled: true,
    image:
      '/src/assets/characters/founders/valeria-frost.jpg',
    biography:
      'Valeria Frost rules the Kingdom of Frosthaven, where survival depends on discipline, sacrifice, and strength. Though many see her as distant, every difficult decision she makes is driven by a fierce desire to protect her people.',
    personality: [
      'Disciplined',
      'Calm',
      'Protective',
      'Intelligent',
      'Reserved',
    ],
    likes: [
      'Snowfall',
      'Strategy',
      'Ancient history',
      'Hot tea',
      'Honesty',
    ],
    dislikes: [
      'Cowardice',
      'Broken oaths',
      'Cruelty',
      'Political games',
      'Wastefulness',
    ],
    worlds: [
      'Frosthaven',
      'Northern Kingdoms',
      'Ice Court',
    ],
    accentColor: '#8cbcff',
  },
  {
    id: 7,
    slug: 'ragnar-stoneheart',
    name: 'Ragnar Stoneheart',
    title: 'High King of the North',
    description:
      'A warrior feared by his enemies and loved by the people who call him king.',
    category: 'Fantasy',
    rating: 5,
    romanceEnabled: true,
adultContentEnabled: true,
    image:
      '/src/assets/characters/founders/ragnar-stoneheart.jpg',
    biography:
      'Ragnar Stoneheart united the fractured northern clans after decades of war. Though unmatched in battle, he never sought conquest for glory. Every campaign he fought was to give his people peace and a future worth defending.',
    personality: [
      'Honourable',
      'Fearless',
      'Protective',
      'Loyal',
      'Straightforward',
    ],
    likes: [
      'Feasting',
      'Axes',
      'Snow',
      'Storytelling',
      'Family',
    ],
    dislikes: [
      'Cowards',
      'Dishonour',
      'Lies',
      'Slavery',
      'Needless cruelty',
    ],
    worlds: [
      'Stonepeak',
      'Northern Clans',
      'The Great Fjords',
    ],
    accentColor: '#9f8d70',
  },
]