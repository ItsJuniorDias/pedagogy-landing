import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from './Avatar.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { levelById } from '../../data.app.js'
import { EASE, spring } from '../../motion.js'

export default function ReaderSwitcher({ align = 'right' }) {
  const { user, readers, activeReader, setActiveReader, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (!activeReader) {
    return (
      <button onClick={() => navigate('/app/profile')} className="btn3d b-grape px-4 py-2 text-sm">
        ＋ Add a reader
      </button>
    )
  }

  const go = (to, state) => {
    setOpen(false)
    navigate(to, state ? { state } : undefined)
  }

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.97 }}
        transition={spring.press}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full bg-white pl-1.5 pr-3 py-1.5 ring-1 ring-black/5 shadow-sm hover:shadow transition"
      >
        <Avatar emoji={activeReader.emoji} color={activeReader.color} size={36} selected />
        <span className="hidden sm:block font-display font-extrabold text-ink leading-none max-w-[8rem] truncate">
          {activeReader.name}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6B6273"
          strokeWidth="2.6"
          strokeLinecap="round"
          className={'transition-transform ' + (open ? 'rotate-180' : '')}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: EASE }}
            role="menu"
            className={
              'absolute z-50 mt-2 w-72 rounded-3xl bg-white p-3 shadow-[0_24px_50px_-20px_rgba(58,49,66,.5)] ring-1 ring-black/5 ' +
              (align === 'right' ? 'right-0' : 'left-0')
            }
          >
            <p className="px-3 pt-1 pb-2 text-[12px] font-extrabold uppercase tracking-wide text-inksoft">
              Who's reading?
            </p>

            <div className="space-y-1 max-h-64 overflow-auto">
              {readers.map((r) => {
                const active = r.id === activeReader.id
                return (
                  <button
                    key={r.id}
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setActiveReader(r.id)
                      setOpen(false)
                    }}
                    className={
                      'w-full flex items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition ' +
                      (active ? 'bg-lilac/70' : 'hover:bg-cream')
                    }
                  >
                    <Avatar emoji={r.emoji} color={r.color} size={40} selected={active} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display font-extrabold text-ink leading-tight truncate">
                        {r.name}
                      </span>
                      <span className="block text-[12px] font-bold text-inksoft truncate">
                        {levelById(r.level).label}
                      </span>
                    </span>
                    {active && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6D4BE0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => go('/app/profile', { add: true })}
              className="mt-1 w-full flex items-center gap-3 rounded-2xl px-2.5 py-2 text-left hover:bg-cream transition"
            >
              <span className="grid place-items-center w-10 h-10 rounded-full bg-sage text-mintd text-xl font-extrabold">＋</span>
              <span className="font-display font-extrabold text-ink">Add a reader</span>
            </button>

            <div className="my-2 h-px bg-black/5" />

            <button
              onClick={() => go('/app/profile')}
              className="w-full flex items-center gap-3 rounded-2xl px-2.5 py-2 text-left hover:bg-cream transition"
            >
              <Avatar emoji={user.avatar} color="grape" size={40} ring={false} />
              <span className="min-w-0 flex-1">
                <span className="block font-display font-extrabold text-ink leading-tight truncate">
                  {user.name}
                </span>
                <span className="block text-[12px] font-bold text-inksoft truncate">{user.email}</span>
              </span>
              <span className="text-[12px] font-extrabold text-grape">Manage</span>
            </button>

            <button
              onClick={() => {
                setOpen(false)
                logout()
                navigate('/')
              }}
              className="mt-1 w-full flex items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left hover:bg-blush/60 transition font-display font-extrabold text-bubbled"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
