import { Link } from 'react-router-dom'

function LoginPage() {
  return (
    <main className="landing-page">
      <section className="hero-card">
        <h1>Log In</h1>

        <p>Welcome back to VelvetVerse.</p>

        <button type="button" className="primary-button">
          Sign In
        </button>

        <Link to="/" className="text-button">
          Back to home
        </Link>
      </section>
    </main>
  )
}

export default LoginPage