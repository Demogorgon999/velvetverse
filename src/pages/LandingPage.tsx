import '../App.css'
import Hero from '../components/landing/Hero'
import AgeGate from '../components/landing/AgeGate'
import AccountLinks from '../components/landing/AccountLinks'
import Footer from '../components/landing/Footer'

function LandingPage() {
  return (
    <main className="landing-page">
      <section className="hero-card">
        <Hero />
        <AgeGate />
        <AccountLinks />
        <Footer />
      </section>
    </main>
  )
}

export default LandingPage