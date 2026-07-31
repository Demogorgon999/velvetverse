import { useState } from 'react'
import './App.css'

function App() {
  const [isAdult, setIsAdult] = useState(false)

  return (
    <main className="landing-page">
      <section className="hero-card">
        <p className="eyebrow">Interactive AI storytelling</p>

        <h1>VelvetVerse</h1>

        <p className="tagline">
          Step into immersive worlds, meet unforgettable characters,
          and shape stories through every conversation.
        </p>

        <div className="age-confirmation">
          <input
            id="age-confirmation"
            type="checkbox"
            checked={isAdult}
            onChange={(event) => setIsAdult(event.target.checked)}
          />

          <label htmlFor="age-confirmation">
            I confirm that I am 18 years or older.
          </label>
        </div>

        <button className="primary-button" type="button" disabled={!isAdult}>
          Enter VelvetVerse
        </button>

        <div className="account-links">
          <button type="button" className="text-button">
            Log in
          </button>

          <button type="button" className="text-button">
            Create account
          </button>
        </div>

        <p className="disclaimer">
          All characters and stories are fictional. Adult areas will be
          restricted to verified adult users.
        </p>
      </section>
    </main>
  )
}

export default App