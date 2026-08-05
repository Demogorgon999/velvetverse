import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { characters } from '../data/characters'

function CharacterPage() {
  const { id } = useParams()

  const character = characters.find(
    (item) => item.id === Number(id),
  )

  if (!character) {
    return (
      <>
        <Navbar />

        <main className="character-page">
          <section className="character-profile">
            <h1>Character not found</h1>

            <Link to="/characters" className="character-back-link">
              ← Back to Characters
            </Link>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />

      <main className="character-page">
        <section
          className="character-profile"
          style={
            {
              '--accent-color': character.accentColor,
            } as React.CSSProperties
          }
        >
          <Link to="/characters" className="character-back-link">
            ← Back to Characters
          </Link>

          <div className="character-profile-header">
            <div className="character-profile-image">
              <img src={character.image} alt={character.name} />
            </div>

            <div className="character-profile-intro">
              <p className="eyebrow">{character.category}</p>

              <h1>{character.name}</h1>

              <p className="character-profile-title">
                {character.title}
              </p>

              <div
                className="character-rating"
                aria-label={`${character.rating} stars`}
              >
                {'★'.repeat(character.rating)}
              </div>

              <p className="character-profile-description">
                {character.description}
              </p>

              <Link
                to={`/chat/${character.id}`}
                className="character-start-button"
              >
                Start Conversation
              </Link>
            </div>
          </div>

          <div className="character-profile-grid">
            <article className="character-info-card">
              <h2>Biography</h2>
              <p>{character.biography}</p>
            </article>

            <article className="character-info-card">
              <h2>Personality</h2>

              <div className="character-tags">
                {character.personality.map((trait) => (
                  <span key={trait}>{trait}</span>
                ))}
              </div>
            </article>

            <article className="character-info-card">
              <h2>Likes</h2>

              <ul>
                {character.likes.map((like) => (
                  <li key={like}>{like}</li>
                ))}
              </ul>
            </article>

            <article className="character-info-card">
              <h2>Dislikes</h2>

              <ul>
                {character.dislikes.map((dislike) => (
                  <li key={dislike}>{dislike}</li>
                ))}
              </ul>
            </article>

            <article className="character-info-card">
              <h2>Story Worlds</h2>

              <div className="character-tags">
                {character.worlds.map((world) => (
                  <span key={world}>{world}</span>
                ))}
              </div>
            </article>

            <article className="character-info-card">
              <h2>Relationship Status</h2>

              <p>Unknown — your story has only just begun.</p>
            </article>
          </div>
        </section>
      </main>
    </>
  )
}

export default CharacterPage