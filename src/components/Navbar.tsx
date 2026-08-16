import {
  Link,
  NavLink,
} from 'react-router-dom'

function Navbar() {
  return (
    <header className="navbar">
      <Link
        to="/"
        className="navbar-brand"
      >
        VelvetVerse
      </Link>

      <nav className="navbar-links">
        <NavLink to="/dashboard">
          Home
        </NavLink>

        <NavLink to="/marketplace">
          Marketplace
        </NavLink>

        <NavLink to="/characters">
          Characters
        </NavLink>

        <NavLink to="/my-characters">
          My Characters
        </NavLink>

        <NavLink to="/creator-studio/new">
          Creator Studio
        </NavLink>

        <NavLink to="/chat">
          Chat
        </NavLink>
      </nav>

      <div className="navbar-account">
        <span className="credit-badge">
          ◇ 1,250
        </span>

        <button
          type="button"
          className="profile-button"
        >
          DV
        </button>
      </div>
    </header>
  )
}

export default Navbar