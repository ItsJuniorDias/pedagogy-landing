import { motion } from 'framer-motion'
import { IMG } from '../assets.js'
import { AppleBadge, GoogleBadge, Stagger, RevealItem } from './ui.jsx'
import { scaleIn, fadeUp, spring, viewport as vp } from '../motion.js'

export default function FinalCTA() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-butter via-blush to-lilac ring-1 ring-black/5 px-6 py-12 sm:px-12 sm:py-14 text-center shadow-xl"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={scaleIn}
        >
          {/* floating decorations (transform-only loops keep their soft opacity) */}
          <motion.div
            className="pointer-events-none absolute -top-10 -left-8 text-6xl opacity-30"
            aria-hidden="true"
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            ⭐
          </motion.div>
          <motion.div
            className="pointer-events-none absolute top-8 right-6 text-5xl opacity-30"
            aria-hidden="true"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🚀
          </motion.div>
          <motion.div
            className="pointer-events-none absolute bottom-4 left-10 text-5xl opacity-30"
            aria-hidden="true"
            animate={{ y: [0, -11, 0], rotate: [-4, 4, -4] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            📖
          </motion.div>

          <Stagger className="relative" stagger={0.1} amount={0.4}>
            <RevealItem variants={fadeUp}>
              <motion.img
                src={IMG.appIcon}
                alt="Pedagogy app icon"
                className="mx-auto w-20 h-20 rounded-3xl shadow-lg ring-1 ring-black/10"
                initial={{ scale: 0, rotate: -12 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={spring.bouncy}
                whileHover={{ scale: 1.08, rotate: 4 }}
              />
            </RevealItem>
            <RevealItem variants={fadeUp} as="h2" className="mt-5 font-extrabold text-4xl sm:text-5xl text-ink leading-tight">
              Start your child's
              <br />
              reading adventure today
            </RevealItem>
            <RevealItem variants={fadeUp} as="p" className="mt-4 text-lg text-inksoft font-bold max-w-xl mx-auto">
              Join 50,000+ families turning screen time into story time. It's free to begin.
            </RevealItem>
            <RevealItem variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <AppleBadge />
              <GoogleBadge />
            </RevealItem>
            <RevealItem variants={fadeUp} as="div" className="mt-4 text-sm font-bold text-inksoft">
              No ads · Made with educators · Ages 2–10
            </RevealItem>
          </Stagger>
        </motion.div>
      </div>
    </section>
  )
}
