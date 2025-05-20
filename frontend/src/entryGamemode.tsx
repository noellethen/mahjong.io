import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GameModePage from './pages/gamemodepage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameModePage />
  </StrictMode>,
)
