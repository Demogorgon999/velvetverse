import { Link } from 'react-router-dom'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardTopbar from '../components/dashboard/DashboardTopbar'
import SearchBar from '../components/SearchBar'
import { characters } from '../data/characters'
import './DashboardPage.css'

function DashboardPage() {
  const featuredCharacter =
    characters.find(
      (character) =>
        character.slug === 'lady-seraphina',
    ) ?? characters[0]

  const trendingCharacters = [
    {
      character:
        characters.find(
          (character) =>
            character.slug === 'nova-7',
        ) ?? characters[0],
      growth: 18,
    },
    {
      character:
        characters.find(
          (character) =>
            character.slug === 'kael-draven',
        ) ?? characters[0],
      growth: 11,
    },
    {
      character:
        characters.find(
          (character) =>
            character.slug === 'lyra-moonvale',
        ) ?? characters[0],
      growth: 7,
    },
    {
      character:
        characters.find(
          (character) =>
            character.slug ===
            'lady-seraphina',
        ) ?? characters[0],
      growth: 5,
    },
  ]

  return (
    <main className="vv-dashboard-layout">
      <DashboardSidebar />

      <section className="vv-dashboard-main">
        <DashboardTopbar />

        <div className="vv-dashboard-search">
          <SearchBar />

          <button type="button">
            ☷ Filters
          </button>
        </div>

        <div className="vv-dashboard-grid">
          <section className="vv-dashboard-panel vv-journey-panel">
            <div className="vv-panel-heading">
              <div>
                <p className="vv-panel-kicker">
                  Return to their world
                </p>

                <h2>Continue Your Journey</h2>
              </div>

              <Link to="/chat">
                View all
              </Link>
            </div>

            <div className="vv-journey-list">
             {characters
  .slice(0, 4)
  .map((character) => (
                  <article
                    key={character.id}
                    className="vv-journey-item"
                    style={{
                      '--vv-character-accent':
                        character.accentColor,
                    } as React.CSSProperties}
                  >
                    <img
                      src={character.image}
                      alt={character.name}
                    />

                    <div className="vv-journey-item-copy">
                      <h3>{character.name}</h3>

                      <p>{character.title}</p>

                      <div className="vv-journey-progress">
                        <span />
                      </div>

                      <Link
                        to={`/chat/${character.id}`}
                      >
                        Continue →
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          </section>

          {featuredCharacter && (
            <section className="vv-dashboard-panel vv-founder-panel">
              <div className="vv-founder-panel-copy">
                <p className="vv-panel-kicker">
                  Featured Founder
                </p>

                <h2>
                  {featuredCharacter.name}
                </h2>

                <p className="vv-founder-title">
                  {featuredCharacter.title}
                </p>

                <div className="vv-founder-tags">
                  <span>Elegant</span>
                  <span>Ancient</span>
                  <span>Dangerous</span>
                </div>

                <div className="vv-founder-rating">
                  {'★'.repeat(
                    featuredCharacter.rating,
                  )}

                  <span>
                    {featuredCharacter.rating}.0
                  </span>
                </div>

                <div className="vv-founder-actions">
                  <Link
                    to={`/chat/${featuredCharacter.id}`}
                    className="vv-founder-primary"
                  >
                    Continue Conversation
                  </Link>

                  <Link
                    to={`/characters/${featuredCharacter.id}`}
                    className="vv-founder-secondary"
                  >
                    View Character
                  </Link>
                </div>
              </div>

              <div className="vv-founder-panel-art">
                <img
                  src={featuredCharacter.image}
                  alt={featuredCharacter.name}
                />

                <div />
              </div>
            </section>
          )}
        </div>

        <div className="vv-dashboard-lower-grid">
          <section className="vv-dashboard-panel vv-featured-founders-panel">
            <div className="vv-panel-heading">
              <div>
                <p className="vv-panel-kicker">
                  VelvetVerse Originals
                </p>

              <h2>Featured Founders ({characters.length})</h2>
              </div>

              <Link to="/characters">
                View all
              </Link>
            </div>

           <div className="vv-featured-founders-grid">
  {characters.map((character) => (
                  <article
                    key={character.id}
                    className="vv-featured-founder-card"
                  >
                    <div className="vv-featured-founder-image">
                      <img
                        src={character.image}
                        alt={character.name}
                      />
                    </div>

                    <div className="vv-featured-founder-copy">
                      <div className="vv-featured-founder-rating">
                        {'★'.repeat(
                          character.rating,
                        )}

                        <span>
                          {character.rating}.0
                        </span>
                      </div>

                      <h3>{character.name}</h3>

                      <p>{character.title}</p>

                      <Link
                        to={`/characters/${character.id}`}
                      >
                        View Character
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          </section>

          <section className="vv-dashboard-panel vv-trending-panel">
            <div className="vv-panel-heading">
              <div>
                <p className="vv-panel-kicker">
                  Rising this week
                </p>

                <h2>Trending Now</h2>
              </div>

              <Link to="/characters">
                View all
              </Link>
            </div>

            <div className="vv-trending-list">
              {trendingCharacters.map(
                ({ character, growth }, index) => (
                  <article
                    key={character.id}
                    className="vv-trending-item"
                  >
                    <span className="vv-trending-rank">
                      {index + 1}
                    </span>

                    <img
                      src={character.image}
                      alt={character.name}
                    />

                    <div className="vv-trending-copy">
                      <h3>{character.name}</h3>

                      <p>{character.title}</p>
                    </div>

                    <div className="vv-trending-line">
                      <span
                        style={{
                          width: `${55 + growth}%`,
                        }}
                      />
                    </div>

                    <strong>↗ {growth}%</strong>
                  </article>
                ),
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default DashboardPage