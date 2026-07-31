import { useState } from 'react'
import { Link } from 'react-router-dom'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setError('')

    alert('Login successful! Authentication will be connected later.')
  }

  return (
    <main className="landing-page">
      <section className="hero-card">
        <h1>Log In</h1>

        <p>Welcome back to VelvetVerse.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
          />

          {error && (
            <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
              {error}
            </p>
          )}

          <button type="submit" className="primary-button">
            Sign In
          </button>
        </form>

        <Link to="/register" className="text-button">
          Create an account
        </Link>

        <Link to="/" className="text-button">
          Back to home
        </Link>
      </section>
    </main>
  )
}

export default LoginPage