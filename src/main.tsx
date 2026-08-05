import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import './styles/global.css'
import './styles/navbar.css'
import './styles/characters.css'
import './styles/character-page.css'
import './styles/chat-page.css'
import './styles/landing.css'
import './styles/creator-studio.css'
import './styles/my-characters.css'
import './styles/marketplace.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)