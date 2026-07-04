import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IMG } from '../assets.js'
import { spring } from '../motion.js'
import { useGetApp } from '../hooks/useGetApp.js'

// -----------------------------------------------------------------------------
// StickyCTA — persistent bottom bar on MOBILE (where most ad traffic lands).
// It slides in once the visitor scrolls past the hero, keeping the primary
// "get the app" action one thumb-tap away no matter how far they read.
//
// The device-aware destination (App Store on iOS, web app elsewhere) and the
// DownloadClick tracking both come from useGetApp, so this button reports into
// the same funnel as every other CTA (placement: 'sticky_bar').
// -----------------------------------------------------------------------------
export default function StickyCTA() {
  const [show, setShow] = useState(false)
  const app = useGetApp({ placement: 'sticky_bar', cta: 'download_free' })

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Publish our height so the WhatsApp float lifts above the bar (it reads
  // var(--sticky-cta-h) in its bottom offset). Only on mobile — the bar is
  // md:hidden, so on desktop the var must stay 0 or the float would jump.
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () =>
      root.style.setProperty('--sticky-cta-h', show && mq.matches ? '74px' : '0px')
    apply()
    mq.addEventListener?.('change', apply)
    return () => {
      mq.removeEventListener?.('change', apply)
      root.style.setProperty('--sticky-cta-h', '0px')
    }
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="md:hidden fixed inset-x-0 bottom-0 z-40"
          initial={{ y: 96 }}
          animate={{ y: 0 }}
          exit={{ y: 96 }}
          transition={spring.soft}
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="mx-3 mb-3 rounded-2xl bg-white/95 backdrop-blur ring-1 ring-black/5 shadow-[0_-8px_30px_-12px_rgba(58,49,66,.45)] p-2.5 flex items-center gap-3">
            <img src={IMG.appIcon} alt="" className="w-11 h-11 rounded-xl ring-1 ring-black/5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-display font-extrabold text-ink text-[15px] leading-tight truncate">
                Pedagogy
              </div>
              <div className="text-[12px] font-bold text-inksoft leading-tight">
                Free · No ads · Ages 2–10
              </div>
            </div>
            <motion.a
              {...app}
              className="btn3d b-pink px-5 py-3 text-[15px] shrink-0"
              whileTap={{ scale: 0.96 }}
              transition={spring.press}
            >
              Get it free
            </motion.a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
