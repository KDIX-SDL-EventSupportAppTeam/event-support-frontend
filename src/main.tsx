// 掃除は authStore の評価より前に走らせる（理由は purgeStorageOnBoot.ts）。必ず最初の import にする
import './shared/config/purgeStorageOnBoot'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { bindSocketToAuth } from '@/shared/api/socket'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './shared/styles/tokens.scss'
import './shared/styles/brand-logo.scss'
import './shared/styles/legacy-app.scss'
import './shared/styles/legacy-participant-pages.scss'

bindSocketToAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
