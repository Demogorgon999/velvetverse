import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SearchBar from '../components/SearchBar'
import CharacterCard from '../components/CharacterCard'
import { characters } from '../data/characters'
import './DashboardPage.css'

function DashboardPage() {
  const featuredCharacter =
    characters.find(
      (character) =>
        character.slug === 'lady-seraphina',
    ) ?? characters[0]

  const journeyCharacters = characters.slice(0, 4)
  const founderCharacters = characters.slice(0, 4)

  const universeCards = [
    {
      title: 'Dark Fantasy',
      description:
        'Forbidden bonds, ancient rulers, and dangerous secrets.',
      symbol: '✦',
    },
    {
      title: 'High Fantasy',
      description:
        'Magic, enchanted kingdoms, and unforgettable journeys.',
      symbol: '◇',
    },
    {
      title: 'Sci-Fi',
      description:
        'Artificial minds, neon cities, and distant worlds.',
      symbol: '◈',
    },
    {
      title: 'Romance',
      description:
        'Relationships shaped by trust, memory, and emotion.',
      symbol: '♡',
    },
  ]

  return (
    <>
      <Navbar />

      <main className="vv-dashboard">
        <section className="vv-dashboard-shell">
          <div className="vv-dashboard-welcome">
            <div>
              <p className="vv-dashboard-kicker">
                Your VelvetVerse
              </p>

              <h1>Welcome back, Dean.</h1>

              <p>
                Continue your story with characters
                who remember, feel, reason, and grow
                with every conversation.
              </p>
            </div>

            <SearchBar />
          </div>

          {featuredCharacter && (
            <section className="vv-featured">
              <div className="vv-featured-copy">
                <span className="vv-featured-label">
                  Featured Founder
                </span>

                <h2>{featuredCharacter.name}</h2>

                <p className="vv-featured-title">
                  {featuredCharacter.title}
                </p>

                <p className="vv-featured-description">
                  {featuredCharacter.description}
                </p>

                <div
                  className="vv-featured-rating"
                  aria-label={`${featuredCharacter.rating} stars`}
                >
                  {'★'.repeat(
                    featuredCharacter.rating,
                  )}
                </div>

                <div className="vv-featured-actions">
                  <Link
                    to={`/chat/${featuredCharacter.id}`}
                    className="vv-button vv-button-primary"
                  >
                    Continue Conversation
                  </Link>

                  <Link
                    to={`/characters/${featuredCharacter.id}`}
                    className="vv-button vv-button-secondary"
                  >
                    View Character
                  </Link>
                </div>
              </div>

              <div className="vv-featured-art">
                <img
                  src={featuredCharacter.image}
                  alt={featuredCharacter.name}
                />

                <div className="vv-featured-art-shade" />
              </div>
            </section>
          )}

          <section className="vv-dashboard-section">
            <div className="vv-section-heading">
              <div>
                <p className="vv-dashboard-kicker">
                  Return to their world
                </p>

                <h2>Continue Your Journey</h2>
              </div>

              <Link to="/chat">
                View conversations
              </Link>
            </div>

            <div className="vv-journey-grid">
              {journeyCharacters.map((character) => (
                <article
                  key={character.id}
                  className="vv-journey-card"
                  style={{
                    '--vv-card-accent':
                      character.accentColor,
                  } as React.CSSProperties}
                >
                  <img
                    src={character.image}
                    alt={character.name}
                  />

                  <div className="vv-journey-shade" />

                  <div className="vv-journey-content">
                    <span>{character.category}</span>

                    <h3>{character.name}</h3>

                    <p>{character.title}</p>

                    <Link to={`/chat/${character.id}`}>
                      Continue Chat
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="vv-dashboard-section">
            <div className="vv-section-heading">
              <div>
                <p className="vv-dashboard-kicker">
                  VelvetVerse Originals
                </p>

                <h2>Featured Founders</h2>
              </div>

              <Link to="/characters">
                Explore all
              </Link>
            </div>

            <div className="vv-founders-grid">
              {founderCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                />
              ))}
            </div>
          </section>

          <section className="vv-dashboard-section">
            <div className="vv-section-heading">
              <div>
                <p className="vv-dashboard-kicker">
                  Discover new stories
                </p>

                <h2>Explore the Universe</h2>
              </div>
            </div>

            <div className="vv-universe-grid">
              {universeCards.map((card) => (
                <Link
                  key={card.title}
                  to="/characters"
                  className="vv-universe-card"
                >
                  <span>{card.symbol}</span>

                  <div>
                    <h3>{card.title}</h3>

                    <p>{card.description}</p>
                  </div>

                  <strong>Explore →</strong>
                </Link>
              ))}
            </div>
          </section>

          <section className="vv-creator-banner">
            <div>
              <p className="vv-dashboard-kicker">
                Creator Studio
              </p>

              <h2>Create someone unforgettable.</h2>

              <p>
                Build characters with identities,
                memories, emotions, goals, secrets,
                fears, and relationships.
              </p>
            </div>

            <Link
              to="/creator-studio"
              className="vv-button vv-button-primary"
            >
              Open Creator Studio
            </Link>
          </section>
        </section>
      </main>
    </>
  )
}

export default DashboardPage