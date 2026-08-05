import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CharactersPage from './pages/CharactersPage'
import CharacterPage from './pages/CharacterPage'
import ChatPage from './pages/ChatPage'
import CreatorStudioPage from './pages/CreatorStudioPage'
import MyCharactersPage from './pages/MyCharactersPage'
import MarketplacePage from './pages/MarketplacePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/characters" element={<CharactersPage />} />
      <Route path="/characters/:id" element={<CharacterPage />} />
      <Route path="/chat/:id" element={<ChatPage />} />

      <Route
        path="/creator-studio"
        element={<CreatorStudioPage />}
      />

      <Route
        path="/creator-studio/new"
        element={<CreatorStudioPage />}
      />

      <Route
        path="/creator-studio/:characterId"
        element={<CreatorStudioPage />}
      />

      <Route
        path="/my-characters"
        element={<MyCharactersPage />}
      />

      <Route
        path="/marketplace"
        element={<MarketplacePage />}
      />
    </Routes>
  )
}

export default App