import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './shared/styles/tokens.scss'
import './shared/styles/brand-logo.scss'
import './shared/styles/legacy-app.scss'
import './shared/styles/legacy-participant-pages.scss'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
