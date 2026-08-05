import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import MarketplaceCharacterCard from '../components/MarketplaceCharacterCard'
import '../styles/marketplace.css'
const marketplaceCharacters = [
  {
    id: 1,
    name: 'Lady Seraphina',
    title: 'The Last Vampire Queen',
    category: 'Fantasy',
    description:
      'An immortal queen who rules a forgotten kingdom beneath eternal moonlight.',
    followers: 18420,
    rating: 4.9,
    initials: 'LS',
  },
  {
    id: 2,
    name: 'Nova-7',
    title: 'The Cyber Detective',
    category: 'Sci-Fi',
    description:
      'A brilliant investigator uncovering conspiracies across a neon-lit future.',
    followers: 12480,
    rating: 4.8,
    initials: 'N7',
  },
  {
    id: 3,
    name: 'Lyra Moonvale',
    title: 'The Elven Princess',
    category: 'Fantasy',
    description:
      'A compassionate royal caught between ancient magic and a kingdom at war.',
    followers: 9650,
    rating: 4.7,
    initials: 'LM',
  },
]

const categories = [
  'All',
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Horror',
  'Mystery',
  'Adventure',
]

function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState('All')

  const filteredCharacters = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase()

    return marketplaceCharacters.filter((character) => {
      const matchesSearch =
        !normalizedSearch ||
        character.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        character.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        character.category
          .toLowerCase()
          .includes(normalizedSearch) ||
        character.description
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesCategory =
        selectedCategory === 'All' ||
        character.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  return (
    <>
      <Navbar />

      <main className="marketplace-page">
        <section className="marketplace-hero">
          <p className="eyebrow">
            Discover VelvetVerse
          </p>

          <h1>Find Your Next Story</h1>

          <p>
            Explore unforgettable characters, immersive worlds,
            and creators building the next generation of AI
            storytelling.
          </p>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search characters, worlds or creators..."
            aria-label="Search marketplace"
          />
        </section>

        <section className="marketplace-section">
          <div className="marketplace-category-list">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? 'marketplace-category-button active'
                    : 'marketplace-category-button'
                }
                onClick={() =>
                  setSelectedCategory(category)
                }
              >
                {category}
              </button>
            ))}
          </div>

          <div className="marketplace-section-heading">
            <div>
              <p className="eyebrow">Trending</p>

              <h2>
                {selectedCategory === 'All'
                  ? 'Popular Characters'
                  : `${selectedCategory} Characters`}
              </h2>
            </div>

            <span className="marketplace-result-count">
              {filteredCharacters.length}{' '}
              {filteredCharacters.length === 1
                ? 'character'
                : 'characters'}
            </span>
          </div>

          {filteredCharacters.length > 0 ? (
            <div className="marketplace-character-grid">
              {filteredCharacters.map((character) => (
                <MarketplaceCharacterCard
                  key={character.id}
                  {...character}
                />
              ))}
            </div>
          ) : (
            <div className="marketplace-empty-state">
              <h2>No characters found</h2>

              <p>
                Try a different search term or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('All')
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  )
}

export default MarketplacePage