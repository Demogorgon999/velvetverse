import { Link } from 'react-router-dom'

function RegisterPage() {
  return (
    <main className="landing-page">
      <section className="hero-card">
        <h1>Create Your Account</h1>

        <p>Join VelvetVerse and begin your adventure.</p>

        <button type="button" className="primary-button">
          Create Account
        </button>

        <Link to="/" className="text-button">
          Back to home
        </Link>
      </section>
    </main>
  )
}

export default RegisterPage