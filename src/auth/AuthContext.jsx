// -----------------------------------------------------------------------------
// AuthContext.jsx — mock authentication + reader management.
//
// ⚠️ This is a CLIENT-ONLY MOCK so the app flow works end to end without a
// backend. "Logging in" with any email/password succeeds; sessions are kept in
// localStorage. Replace login()/signup() with real API calls when ready — the
// component API (useAuth) can stay the same.
// -----------------------------------------------------------------------------
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { SEED_READERS, freshStats } from '../data.app.js'

const DB_KEY = 'pedagogy.db.v1' // { [email]: account }
const CUR_KEY = 'pedagogy.current.v1' // email of the signed-in account

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

// --- localStorage helpers (guarded so SSR / private mode never crash) --------
const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
const writeJSON = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* storage full or unavailable — ignore in this mock */
  }
}

const newId = (p = 'rdr') => `${p}_${Math.random().toString(36).slice(2, 9)}`

// Build a brand-new account object from signup details.
const makeAccount = ({ name, email, avatar = '🦉', firstReader, seed = false }) => {
  const readers = []
  if (firstReader) {
    readers.push({
      id: newId(),
      name: firstReader.name,
      emoji: firstReader.emoji || '🐻',
      color: firstReader.color || 'grape',
      age: firstReader.age ?? 5,
      level: firstReader.level || 'explorer',
      stats: freshStats(),
    })
  }
  if (seed) readers.push(...SEED_READERS.map((r) => ({ ...r })))
  return {
    user: { name: name || 'Friend', email, avatar, plan: 'Free' },
    readers,
    activeReaderId: readers[0]?.id || null,
  }
}

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [ready, setReady] = useState(false)

  // Restore session on first mount.
  useEffect(() => {
    const email = readJSON(CUR_KEY, null)
    const db = readJSON(DB_KEY, {})
    if (email && db[email]) setAccount(db[email])
    setReady(true)
  }, [])

  // Persist the active account back into the db whenever it changes.
  useEffect(() => {
    if (!account) return
    const db = readJSON(DB_KEY, {})
    db[account.user.email] = account
    writeJSON(DB_KEY, db)
    writeJSON(CUR_KEY, account.user.email)
  }, [account])

  // --- auth actions ----------------------------------------------------------
  const login = useCallback(({ email, name }) => {
    const db = readJSON(DB_KEY, {})
    const existing = db[email]
    // Returning account → restore it. New email → spin up a demo account with
    // sample readers so the dashboard has something to show.
    const next = existing || makeAccount({ name, email, seed: true })
    setAccount(next)
    return next
  }, [])

  const signup = useCallback(({ name, email, firstReader }) => {
    const next = makeAccount({ name, email, firstReader, seed: false })
    setAccount(next)
    return next
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(CUR_KEY)
    } catch {
      /* ignore */
    }
    setAccount(null)
  }, [])

  // --- account + reader mutations -------------------------------------------
  const updateAccount = useCallback((patch) => {
    setAccount((a) => (a ? { ...a, user: { ...a.user, ...patch } } : a))
  }, [])

  const addReader = useCallback((reader) => {
    let id = null
    setAccount((a) => {
      if (!a) return a
      id = newId()
      const r = {
        id,
        name: reader.name?.trim() || 'New reader',
        emoji: reader.emoji || '🐻',
        color: reader.color || 'grape',
        age: reader.age ?? 5,
        level: reader.level || 'explorer',
        stats: freshStats(),
      }
      const readers = [...a.readers, r]
      return { ...a, readers, activeReaderId: a.activeReaderId || id }
    })
    return id
  }, [])

  const updateReader = useCallback((id, patch) => {
    setAccount((a) =>
      a
        ? { ...a, readers: a.readers.map((r) => (r.id === id ? { ...r, ...patch } : r)) }
        : a
    )
  }, [])

  const removeReader = useCallback((id) => {
    setAccount((a) => {
      if (!a) return a
      const readers = a.readers.filter((r) => r.id !== id)
      const activeReaderId =
        a.activeReaderId === id ? readers[0]?.id || null : a.activeReaderId
      return { ...a, readers, activeReaderId }
    })
  }, [])

  const setActiveReader = useCallback((id) => {
    setAccount((a) => (a ? { ...a, activeReaderId: id } : a))
  }, [])

  const value = useMemo(() => {
    const readers = account?.readers || []
    const activeReader =
      readers.find((r) => r.id === account?.activeReaderId) || readers[0] || null
    return {
      ready,
      isAuthed: !!account,
      user: account?.user || null,
      readers,
      activeReader,
      login,
      signup,
      logout,
      updateAccount,
      addReader,
      updateReader,
      removeReader,
      setActiveReader,
    }
  }, [
    account,
    ready,
    login,
    signup,
    logout,
    updateAccount,
    addReader,
    updateReader,
    removeReader,
    setActiveReader,
  ])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
