import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import OwnerPlayer from './OwnerPlayer'
import '../styles/global.css'
import '../styles/navbar.css'
import '../styles/chat-page.css'
import './owner-player.css'
createRoot(document.getElementById('root')!).render(<BrowserRouter basename="/velvetverse"><OwnerPlayer audience="guest"/></BrowserRouter>)
