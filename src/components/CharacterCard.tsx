import { Link } from 'react-router-dom'
import type { Character } from '../data/characters'

type CharacterCardProps = {
  character: Character
}

function CharacterCard({ character }: CharacterCardProps) {
  return (
    <article
      className="character-card"
      style={{ '--accent-color': character.accentColor } as React.CSSProperties}
    >
      <div className="character-card-image">
        <img src={character.image} alt={character.name} />
      </div>

      <div className="character-card-content">
        <h2>{character.name}</h2>

        <p className="character-title">{character.title}</p>

        <div className="character-rating" aria-label={`${character.rating} stars`}>
          {'★'.repeat(character.rating)}
        </div>

        <span className="character-category">
          {character.category}
        </span>

        <p className="character-description">
          {character.description}
        </p>

        <Link
          to={`/characters/${character.id}`}
          className="character-card-button"
        >
          View Character
        </Link>
      </div>
    </article>
  )
}

export default CharacterCard