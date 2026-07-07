import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DebugPage } from './screens/DebugPage.tsx'

const isDebug = new URLSearchParams(window.location.search).has('debug')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isDebug ? <DebugPage /> : <App />}
  </StrictMode>,
)
