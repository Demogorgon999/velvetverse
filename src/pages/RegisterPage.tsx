import { useState } from 'react'
import { Link } from 'react-router-dom'

function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!username || !email || !password || !confirmPassword) {
      setError('Please complete all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')

    alert('Registration successful! (Database coming in Phase 3)')
  }

  return (
    <main className="landing-page">
      <section className="hero-card">
        <h1>Create Your Account</h1>

        <p>Join VelvetVerse and begin your adventure.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
          />

          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
          />

          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
          />

          {error && (
            <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
              {error}
            </p>
          )}

          <button type="submit" className="primary-button">
            Create Account
          </button>
        </form>

        <Link to="/" className="text-button">
          Back to home
        </Link>
      </section>
    </main>
  )
}

export default RegisterPage