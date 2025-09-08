import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { exposeToGlobal } from './utils/debug'
import React from 'react'

// Expose React and Supabase client to global window for debugging
exposeToGlobal(React)


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
