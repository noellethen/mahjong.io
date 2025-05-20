import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import QuizModePage from './pages/quizmodepage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuizModePage />
  </StrictMode>,
)
