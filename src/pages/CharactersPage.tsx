import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CharacterCard from '../components/CharacterCard'
import { characters } from '../data/characters'

function CharactersPage() {
  return (
    <>
      <Navbar />

      <main className="characters-page">
        <section className="characters-section">
          <p className="eyebrow">VelvetVerse Characters</p>

          <h1>Choose Your Story</h1>

          <p>Select a character and step into their world.</p>

          <div className="character-grid">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
              />
            ))}
          </div>

          <Link to="/dashboard" className="text-button">
            Back to Dashboard
          </Link>
        </section>
      </main>
    </>
  )
}

export default CharactersPage