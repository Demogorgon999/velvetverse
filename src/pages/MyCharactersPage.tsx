import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { calculateCharacterScore } from '../services/characterScore'
import {
  deleteCharacter,
  duplicateCharacter,
  getCharacters,
  type SavedCharacter,
} from '../services/characterService'

function MyCharactersPage() {
  const [characters, setCharacters] = useState<SavedCharacter[]>([])

  useEffect(() => {
    setCharacters(getCharacters())
  }, [])

  const characterScores = useMemo(() => {
    return characters.reduce<Record<number, number>>(
      (scores, character) => {
        scores[character.id] = calculateCharacterScore({
          name: character.name,
          title: character.title,
          description: character.description,
          greeting: character.greeting,
          personality: character.personality,
          world: character.world,
          imagePreview: '',
          voice: character.voice,
          memoryEnabled: character.memoryEnabled,
        }).completionScore

        return scores
      },
      {},
    )
  }, [characters])

  const publishedCount = characters.filter(
    (character) => character.status === 'published',
  ).length

  const draftCount = characters.filter(
    (character) => character.status === 'draft',
  ).length

  function handleDelete(characterId: number) {
    const confirmed = window.confirm(
      'Delete this character? This cannot be undone.',
    )

    if (!confirmed) {
      return
    }

    deleteCharacter(characterId)
    setCharacters(getCharacters())
  }

  function handleDuplicate(characterId: number) {
    const duplicatedCharacter =
      duplicateCharacter(characterId)

    if (!duplicatedCharacter) {
      window.alert('Character could not be duplicated.')
      return
    }

    setCharacters(getCharacters())
    window.alert('Character duplicated.')
  }

  return (
    <>
      <Navbar />

      <main className="my-characters-page">
        <section className="my-characters-header">
          <div>
            <p className="eyebrow">
              Creator Dashboard
            </p>

            <h1>My Characters</h1>

            <p>
              Manage your drafts, published characters,
              analytics and earnings.
            </p>
          </div>

          <Link
            to="/creator-studio/new"
            className="create-character-button"
          >
            + Create Character
          </Link>
        </section>

        <section className="creator-overview">
          <article className="overview-card">
            <h3>Characters</h3>

            <strong>{characters.length}</strong>

            <small>
              {draftCount} Drafts • {publishedCount} Published
            </small>
          </article>

          <article className="overview-card">
            <h3>Followers</h3>
            <strong>0</strong>
            <small>Across all characters</small>
          </article>

          <article className="overview-card">
            <h3>Premium Subs</h3>
            <strong>0</strong>
            <small>Active supporters</small>
          </article>

          <article className="overview-card">
            <h3>Monthly Revenue</h3>
            <strong>$0</strong>
            <small>No earnings yet</small>
          </article>
        </section>

        <section className="my-characters-grid">
          {characters.length > 0 ? (
            characters.map((character) => {
              const initials = character.name
                .split(' ')
                .map((word) => word.charAt(0))
                .join('')
                .slice(0, 2)
                .toUpperCase()

              return (
                <article
                  key={character.id}
                  className="character-manager-card"
                >
                  <div className="character-manager-top">
                    <div className="character-manager-avatar">
                      {initials || 'AI'}
                    </div>

                    <div>
                      <h2>
                        {character.name ||
                          'Untitled Character'}
                      </h2>

                      <p>
                        {character.category}
                        {character.title
                          ? ` • ${character.title}`
                          : ''}
                      </p>
                    </div>

                    <span className="draft-badge">
                      {character.status === 'published'
                        ? 'Published'
                        : 'Draft'}
                    </span>
                  </div>

                  <div className="character-progress">
                    <strong>
                      {characterScores[character.id] ?? 0}%
                      Complete
                    </strong>
                  </div>

                  <div className="character-actions">
                    <Link
                      to={`/creator-studio/${character.id}`}
                      className="character-action-primary"
                    >
                      Continue Editing
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleDuplicate(character.id)
                      }
                    >
                      Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(character.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })
          ) : (
            <article className="character-manager-card">
              <div className="character-manager-top">
                <div className="character-manager-avatar">
                  +
                </div>

                <div>
                  <h2>No characters yet</h2>

                  <p>
                    Create your first VelvetVerse character.
                  </p>
                </div>
              </div>

              <div className="character-actions">
                <Link
                  to="/creator-studio/new"
                  className="character-action-primary"
                >
                  Create Character
                </Link>
              </div>
            </article>
          )}
        </section>
      </main>
    </>
  )
}

export default MyCharactersPage