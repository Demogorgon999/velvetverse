import Navbar from '../components/Navbar'
import SearchBar from '../components/SearchBar'

function DashboardPage() {
  return (
    <>
      <Navbar />

      <main className="dashboard-page">
        <section className="dashboard-hero">
          <p className="eyebrow">Your VelvetVerse</p>

          <h1>Discover Your Next Obsession</h1>

          <p>
            Explore unforgettable characters, stories, and worlds.
          </p>

          <SearchBar />
        </section>
      </main>
    </>
  )
}

export default DashboardPage