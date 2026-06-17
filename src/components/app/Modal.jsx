import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '../../motion.js'

/**
 * Modal — centered dialog with a dimmed backdrop.
 * Close on backdrop click or Escape. Locks body scroll while open.
 */
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={spring.soft}
            className={
              'relative w-full ' +
              maxWidth +
              ' bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl ring-1 ring-black/5 max-h-[92vh] overflow-auto'
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur border-b border-black/5">
              <h2 className="font-display font-extrabold text-xl text-ink">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid place-items-center w-9 h-9 rounded-full bg-cream hover:bg-blush text-ink transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
