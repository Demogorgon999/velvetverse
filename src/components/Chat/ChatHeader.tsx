import { Link } from 'react-router-dom'
import type {
  RelationshipProgress,
  RelationshipStage,
} from '../../utils/memory'
import type { MoodState } from '../../utils/mood'

type ChatHeaderProps = {
  id: number
  name: string
  title: string
  image: string
  initials: string
  avatarFailed: boolean
  relationshipStage: RelationshipStage
  relationshipProgress: RelationshipProgress
  mood: MoodState
  onAvatarError: () => void
}

function getMoodIcon(
  mood: MoodState['mood'],
) {
  switch (mood) {
    case 'Calm':
      return '😌'

    case 'Curious':
      return '🤔'

    case 'Playful':
      return '😏'

    case 'Affectionate':
      return '🥰'

    case 'Protective':
      return '🛡️'

    case 'Sad':
      return '😔'

    case 'Irritated':
      return '😒'

    case 'Suspicious':
      return '🧐'

    default:
      return '🙂'
  }
}

function getRelationshipIcon(
  relationshipStage: RelationshipStage,
) {
  switch (relationshipStage) {
    case 'Hostile':
      return '🖤'

    case 'Stranger':
      return '🩶'

    case 'Acquaintance':
      return '🤍'

    case 'Friend':
      return '💚'

    case 'Close Friend':
      return '💜'

    case 'Trusted':
      return '💙'

    case 'Best Friend':
      return '💖'

    case 'Soulmate':
      return '❤️'
  }
}

function ChatHeader({
  id,
  name,
  title,
  image,
  initials,
  avatarFailed,
  relationshipStage,
  relationshipProgress,
  mood,
  onAvatarError,
}: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <Link
        to={`/characters/${id}`}
        className="chat-back-link"
        aria-label={`Return to ${name}'s profile`}
      >
        ←
      </Link>

      <div className="chat-avatar">
        {!avatarFailed ? (
          <img
            src={image}
            alt={name}
            onError={onAvatarError}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <div className="chat-character-details">
        <h1>{name}</h1>

        <p>{title}</p>

        <div className="chat-header-statuses">
          <span className="chat-status">
            <span />
            Online
          </span>

          <span className="chat-relationship">
            {getRelationshipIcon(relationshipStage)}
            {' '}
            {relationshipStage}
          </span>

          <span className="chat-mood">
            {getMoodIcon(mood.mood)}
            {' '}
            {mood.mood}
          </span>
        </div>

        <div className="relationship-panel">
          <div className="relationship-header">
            <span>{relationshipStage}</span>

            <span>
              {relationshipProgress.progressPercent}%
            </span>
          </div>

          <div
            className="relationship-bar"
            role="progressbar"
            aria-label={`${relationshipStage} relationship progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              relationshipProgress.progressPercent
            }
          >
            <div
              className="relationship-fill"
              style={{
                width: `${relationshipProgress.progressPercent}%`,
              }}
            />
          </div>

          {relationshipProgress.nextStage && (
            <small>
              Next: {relationshipProgress.nextStage}
            </small>
          )}
        </div>

        <div className="mood-panel">
          <small>
            {getMoodIcon(mood.mood)}
            {' '}
            Mood: {mood.mood}
          </small>

          <small>
            Intensity: {mood.intensity}/5
          </small>
        </div>
      </div>
    </header>
  )
}

export default ChatHeader