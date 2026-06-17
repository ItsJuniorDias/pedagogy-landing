import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthShell from '../components/auth/AuthShell.jsx'
import { Field, SocialButtons } from '../components/app/Field.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import { spring } from '../motion.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const dest = location.state?.from || '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.')
      return
    }
    // Mock: derive a friendly name from the email handle.
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
    login({ email: email.trim().toLowerCase(), name })
    navigate(dest, { replace: true })
  }

  return (
    <AuthShell
      title="Welcome back 👋"
      subtitle="Log in to keep the reading streak going."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="text-grape font-extrabold hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          error={error && !email.trim() ? error : ''}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-extrabold uppercase tracking-wide text-inksoft">
              Password
            </span>
            <button
              type="button"
              className="text-[13px] font-bold text-grape hover:underline"
              onClick={() => setError('Password reset is coming soon.')}
            >
              Forgot?
            </button>
          </div>
          <Field
            label=""
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
          />
        </div>

        {error && (email.trim() || password) && (
          <p className="text-sm font-bold text-bubbled">{error}</p>
        )}

        <motion.button
          type="submit"
          className="btn3d b-pink w-full px-6 py-3.5 text-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={spring.press}
        >
          Log in
        </motion.button>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-black/10" />
          <span className="text-xs font-bold uppercase tracking-wide text-inksoft">or</span>
          <span className="h-px flex-1 bg-black/10" />
        </div>

        <SocialButtons
          onClick={() => {
            login({ email: 'demo@pedagogy.app', name: 'Demo Parent' })
            navigate(dest, { replace: true })
          }}
        />
      </form>
    </AuthShell>
  )
}
