import { useEffect, useMemo, useState } from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'
import Navbar from '../components/Navbar'
import { calculateCharacterScore } from '../services/characterScore'
import {
  createCharacter,
  getCharacterById,
  updateCharacter,
} from '../services/characterService'

function CreatorStudioPage() {
  const { characterId } = useParams()
  const navigate = useNavigate()

  const editingCharacterId =
    characterId && characterId !== 'new'
      ? Number(characterId)
      : null

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Fantasy')
  const [description, setDescription] = useState('')
  const [greeting, setGreeting] = useState('')
  const [personality, setPersonality] = useState('')
  const [visibility, setVisibility] = useState('Private')
  const [world, setWorld] = useState('')
  const [voice, setVoice] = useState('Elegant')
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [romanceEnabled, setRomanceEnabled] = useState(false)
  const [adultContentEnabled, setAdultContentEnabled] =
    useState(false)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    if (!editingCharacterId) {
      return
    }

    const existingCharacter =
      getCharacterById(editingCharacterId)

    if (!existingCharacter) {
      window.alert('Character could not be found.')
      navigate('/my-characters')
      return
    }

    setName(existingCharacter.name)
    setTitle(existingCharacter.title)
    setCategory(existingCharacter.category)
    setDescription(existingCharacter.description)
    setGreeting(existingCharacter.greeting)
    setPersonality(existingCharacter.personality)
    setVisibility(existingCharacter.visibility)
    setWorld(existingCharacter.world)
    setVoice(existingCharacter.voice)
    setMemoryEnabled(existingCharacter.memoryEnabled)
    setRomanceEnabled(existingCharacter.romanceEnabled)
    setAdultContentEnabled(
      existingCharacter.adultContentEnabled,
    )
  }, [editingCharacterId, navigate])

  const initials = useMemo(() => {
    if (!name.trim()) {
      return 'AI'
    }

    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [name])

  const score = calculateCharacterScore({
    name,
    title,
    description,
    greeting,
    personality,
    world,
    imagePreview,
    voice,
    memoryEnabled,
  })

  const completionScore = score.completionScore

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const characterData = {
      name,
      title,
      category,
      description,
      greeting,
      personality,
      visibility,
      world,
      voice,
      memoryEnabled,
      romanceEnabled,
      adultContentEnabled,
      status: 'draft' as const,
    }

    if (editingCharacterId) {
      const updatedCharacter = updateCharacter(
        editingCharacterId,
        characterData,
      )

      if (!updatedCharacter) {
        window.alert('Character could not be updated.')
        return
      }

      window.alert('Character updated.')
    } else {
      createCharacter(characterData)
      window.alert('Character created.')
    }

    navigate('/my-characters')
  }

  return (
    <>
      <Navbar />

      <main className="creator-studio-page">
        <section className="creator-studio-header">
          <p className="eyebrow">Creator Studio</p>

          <h1>
            {editingCharacterId
              ? 'Edit Your AI Character'
              : 'Build Your AI Character'}
          </h1>

          <p>
            Create a memorable personality, shape their world,
            and prepare them for the VelvetVerse marketplace.
          </p>
        </section>

        <section className="creator-studio-layout">
          <form
            className="creator-form"
            onSubmit={handleSubmit}
          >
            <section className="creator-form-section">
              <div className="creator-section-heading">
                <span>01</span>

                <div>
                  <h2>Identity</h2>

                  <p>
                    Define who your character is and how they
                    appear to users.
                  </p>
                </div>
              </div>

              <label htmlFor="character-image">
                Character portrait
              </label>

              <label
                htmlFor="character-image"
                className="creator-upload-area"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Character preview"
                  />
                ) : (
                  <>
                    <strong>Upload portrait</strong>
                    <span>PNG or JPG recommended</span>
                  </>
                )}
              </label>

              <input
                id="character-image"
                className="creator-file-input"
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleImageChange}
              />

              <label htmlFor="character-name">
                Character name
              </label>

              <input
                id="character-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Lady Seraphina"
                required
              />

              <label htmlFor="character-title">
                Character title
              </label>

              <input
                id="character-title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="The Vampire Queen"
                required
              />

              <label htmlFor="character-category">
                Category
              </label>

              <select
                id="character-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                <option>Fantasy</option>
                <option>Romance</option>
                <option>Sci-Fi</option>
                <option>Horror</option>
                <option>Mystery</option>
                <option>Adventure</option>
              </select>
            </section>

            <section className="creator-form-section">
              <div className="creator-section-heading">
                <span>02</span>

                <div>
                  <h2>Personality</h2>

                  <p>
                    Define how the character speaks, reacts, and
                    behaves.
                  </p>
                </div>
              </div>

              <label htmlFor="character-description">
                Short description
              </label>

              <textarea
                id="character-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Elegant, ancient, and dangerously charming."
                rows={3}
                required
              />

              <label htmlFor="character-greeting">
                Opening greeting
              </label>

              <textarea
                id="character-greeting"
                value={greeting}
                onChange={(event) =>
                  setGreeting(event.target.value)
                }
                placeholder="Welcome, traveler. What brings you into my world tonight?"
                rows={4}
                required
              />

              <label htmlFor="character-personality">
                Personality and behaviour
              </label>

              <textarea
                id="character-personality"
                value={personality}
                onChange={(event) =>
                  setPersonality(event.target.value)
                }
                placeholder="Elegant, intelligent, mysterious, protective..."
                rows={6}
                required
              />

              <label htmlFor="character-voice">
                Voice style
              </label>

              <select
                id="character-voice"
                value={voice}
                onChange={(event) =>
                  setVoice(event.target.value)
                }
              >
                <option>Elegant</option>
                <option>Playful</option>
                <option>Mysterious</option>
                <option>Confident</option>
                <option>Warm</option>
                <option>Cold</option>
              </select>
            </section>

            <section className="creator-form-section">
              <div className="creator-section-heading">
                <span>03</span>

                <div>
                  <h2>World and memory</h2>

                  <p>
                    Give the character context and decide how much
                    they remember.
                  </p>
                </div>
              </div>

              <label htmlFor="character-world">
                Story world
              </label>

              <textarea
                id="character-world"
                value={world}
                onChange={(event) =>
                  setWorld(event.target.value)
                }
                placeholder="A moonlit kingdom ruled by ancient vampire houses..."
                rows={5}
                required
              />

              <div className="creator-toggle-list">
                <label className="creator-toggle">
                  <input
                    type="checkbox"
                    checked={memoryEnabled}
                    onChange={(event) =>
                      setMemoryEnabled(event.target.checked)
                    }
                  />

                  <span>
                    <strong>Long-term memory</strong>

                    <small>
                      Remember important facts and events.
                    </small>
                  </span>
                </label>

                <label className="creator-toggle">
                  <input
                    type="checkbox"
                    checked={romanceEnabled}
                    onChange={(event) =>
                      setRomanceEnabled(event.target.checked)
                    }
                  />

                  <span>
                    <strong>Romance enabled</strong>

                    <small>
                      Allow romantic story development.
                    </small>
                  </span>
                </label>

                <label className="creator-toggle">
                  <input
                    type="checkbox"
                    checked={adultContentEnabled}
                    onChange={(event) =>
                      setAdultContentEnabled(
                        event.target.checked,
                      )
                    }
                  />

                  <span>
                    <strong>Adult content</strong>

                    <small>
                      Restricted to verified adult users.
                    </small>
                  </span>
                </label>
              </div>
            </section>

            <section className="creator-form-section">
              <div className="creator-section-heading">
                <span>04</span>

                <div>
                  <h2>Publishing</h2>

                  <p>
                    Choose how your character will appear on the
                    platform.
                  </p>
                </div>
              </div>

              <label htmlFor="character-visibility">
                Visibility
              </label>

              <select
                id="character-visibility"
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value)
                }
              >
                <option>Private</option>
                <option>Public</option>
                <option>Unlisted</option>
              </select>

              <div className="creator-actions">
                <button
                  type="submit"
                  className="creator-secondary-button"
                >
                  {editingCharacterId
                    ? 'Save Changes'
                    : 'Save Draft'}
                </button>

                <button
                  type="button"
                  className="creator-publish-button"
                  disabled={completionScore < 100}
                >
                  Publish to Marketplace
                </button>
              </div>
            </section>
          </form>

          <aside className="creator-preview">
            <p className="eyebrow">Live Preview</p>

            <div className="creator-phone-preview">
              <div className="creator-phone-topbar">
                <span>VelvetVerse</span>
                <small>Preview</small>
              </div>

              <article className="creator-preview-card">
                <div className="creator-preview-image">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={name || 'Character'}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="creator-preview-content">
                  <span className="creator-preview-category">
                    {category}
                  </span>

                  <h2>{name || 'Your Character'}</h2>

                  <p className="creator-preview-title">
                    {title || 'Character title'}
                  </p>

                  <p>
                    {description ||
                      'Your short character description will appear here.'}
                  </p>

                  <button type="button">
                    Start Conversation
                  </button>
                </div>
              </article>
            </div>

            <section className="creator-score-panel">
              <div className="creator-score-header">
                <div>
                  <h2>Marketplace readiness</h2>

                  <p>
                    Complete every requirement before publishing.
                  </p>
                </div>

                <strong>{completionScore}%</strong>
              </div>

              <div className="creator-score-track">
                <span
                  style={{
                    width: `${completionScore}%`,
                  }}
                />
              </div>

              <ul className="creator-checklist">
                <li className={imagePreview ? 'complete' : ''}>
                  Portrait uploaded
                </li>

                <li className={name.trim() ? 'complete' : ''}>
                  Character named
                </li>

                <li className={description.trim() ? 'complete' : ''}>
                  Description completed
                </li>

                <li className={greeting.trim() ? 'complete' : ''}>
                  Greeting completed
                </li>

                <li className={personality.trim() ? 'complete' : ''}>
                  Personality completed
                </li>

                <li className={world.trim() ? 'complete' : ''}>
                  Story world completed
                </li>
              </ul>
            </section>

            <section className="creator-earnings-panel">
              <p className="eyebrow">
                Creator Intelligence
              </p>

              <h2>Character forecast</h2>

              <p>
                These illustrative estimates update as you improve
                your character profile.
              </p>

              <div className="creator-earnings-grid">
                <div>
                  <strong>{score.qualityScore}%</strong>
                  <span>Quality score</span>
                </div>

                <div>
                  <strong>{score.discoverability}</strong>
                  <span>Discoverability</span>
                </div>

                <div>
                  <strong>
                    {score.estimatedFollowers.toLocaleString()}
                  </strong>
                  <span>Estimated followers</span>
                </div>

                <div>
                  <strong>
                    {score.estimatedPremiumSubscribers.toLocaleString()}
                  </strong>
                  <span>
                    Estimated Premium subscribers
                  </span>
                </div>

                <div>
                  <strong>
                    $
                    {score.estimatedMonthlyEarnings.toLocaleString()}
                  </strong>
                  <span>
                    Illustrative monthly earnings
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </main>
    </>
  )
}

export default CreatorStudioPage