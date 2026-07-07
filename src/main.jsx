import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { EmailGateProvider } from './components/EmailGate.jsx'
import { bootIdentity } from './lib/pixel.js'
import './index.css'

// Aplica o Advanced Matching logo no boot: garante o external_id estável em
// todo evento e, para visitantes recorrentes que já se identificaram, reanexa
// o email — assim eles já são casados desde o primeiro evento desta visita.
bootIdentity()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* reducedMotion="user" → respects the OS "reduce motion" setting site-wide:
        transform/layout animations are disabled, gentle opacity fades remain. */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <EmailGateProvider>
            <App />
          </EmailGateProvider>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>
)
