import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IMG } from '../assets.js'
import { EASE, spring } from '../motion.js'

const LINKS = [
  ['How it works', '#how'],
  ['Stories', '#stories'],
  ['For parents', '#parents'],
  ['Pricing', '#pricing'],
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...spring.soft, delay: 0.05 }}
      className={
        'fixed top-0 inset-x-0 z-50 transition-colors duration-300 ' +
        (solid ? 'bg-cream/90 backdrop-blur-md shadow-[0_2px_20px_-12px_rgba(58,49,66,.5)]' : '')
      }
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <motion.a
          href="#top"
          className="flex items-center gap-2.5 group"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={spring.press}
        >
          <img src={IMG.logo} alt="" className="w-9 h-9 rounded-xl shadow-sm ring-1 ring-black/5" />
          <span className="font-display font-extrabold text-xl text-ink tracking-tight">Pedagogy</span>
        </motion.a>

        <div className="hidden md:flex items-center gap-7">
          {LINKS.map(([l, h]) => (
            <motion.a
              key={h}
              href={h}
              className="font-body font-bold text-[15px] text-inksoft hover:text-grape transition-colors"
              whileHover={{ y: -2 }}
              transition={spring.press}
            >
              {l}
            </motion.a>
          ))}
        </div>

        <div className="hidden md:block">
          <motion.a
            href="#download"
            className="btn3d b-pink px-5 py-2.5 text-[15px]"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={spring.press}
          >
            Get the app
          </motion.a>
        </div>

        <button
          className="md:hidden grid place-items-center w-10 h-10 rounded-xl bg-white shadow ring-1 ring-black/5"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3A3142" strokeWidth="2.4" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="md:hidden overflow-hidden"
          >
            <div className="mx-4 mb-3 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-3">
              {LINKS.map(([l, h], i) => (
                <motion.a
                  key={h}
                  href={h}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-xl font-bold text-ink hover:bg-cream"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i + 0.05, ease: EASE }}
                >
                  {l}
                </motion.a>
              ))}
              <a href="#download" onClick={() => setOpen(false)} className="btn3d b-pink w-full px-5 py-3 mt-1">
                Get the app
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
