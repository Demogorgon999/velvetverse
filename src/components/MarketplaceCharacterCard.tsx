import { Link } from 'react-router-dom'

type MarketplaceCharacterCardProps = {
  id: number
  name: string
  title: string
  category: string
  description: string
  followers: number
  rating: number
  image?: string
  initials: string
}

function MarketplaceCharacterCard({
  id,
  name,
  title,
  category,
  description,
  followers,
  rating,
  image,
  initials,
}: MarketplaceCharacterCardProps) {
  return (
    <article className="marketplace-character-card">
      <div className="marketplace-character-image">
        {image ? (
          <img src={image} alt={name} />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <div className="marketplace-character-content">
        <div className="marketplace-character-meta">
          <span>{category}</span>

          <small>
            {rating.toFixed(1)} ★
          </small>
        </div>

        <h2>{name}</h2>

        <p className="marketplace-character-title">
          {title}
        </p>

        <p className="marketplace-character-description">
          {description}
        </p>

        <div className="marketplace-character-stats">
          <span>
            {followers.toLocaleString()} followers
          </span>
        </div>

        <div className="marketplace-character-actions">
          <Link
            to={`/characters/${id}`}
            className="marketplace-secondary-button"
          >
            View Profile
          </Link>

          <Link
            to={`/chat/${id}`}
            className="marketplace-primary-button"
          >
            Start Chat
          </Link>
        </div>
      </div>
    </article>
  )
}

export default MarketplaceCharacterCard