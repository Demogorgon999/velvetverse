import { useState } from 'react'

function AgeGate() {
  const [accepted, setAccepted] = useState(false)

  return (
    <>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        I confirm that I am 18 years of age or older.
      </label>

      <button disabled={!accepted}>
        Enter VelvetVerse
      </button>
    </>
  )
}

export default AgeGate