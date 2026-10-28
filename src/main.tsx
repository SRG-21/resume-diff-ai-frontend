import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { BillingProvider } from './context/BillingContext.tsx'
import { initAnalytics } from './analytics'

initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BillingProvider>
          <App />
        </BillingProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
