import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'

/**
 * RequireAuth — gate for /app routes. Waits for the session to load, then
 * redirects guests to /login (remembering where they were headed).
 */
export default function RequireAuth({ children }) {
  const { ready, isAuthed } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-cream">
        <div className="text-4xl animate-bounce">🦉</div>
      </div>
    )
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
