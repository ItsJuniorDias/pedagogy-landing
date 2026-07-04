import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { IMG } from '../assets.js'
import { AppleBadge, Stagger, RevealItem } from './ui.jsx'
import { fadeUp, viewport as vp } from '../motion.js'
import { FOOTER_COLS } from '../data.js'

const MotionLink = motion(Link)

// Renders the right element per destination: external URL → new-tab <a>,
// in-app route (/signup) → router <Link>, in-page anchor (#how) → plain <a>.
function FooterLink({ href, children }) {
  const cls = 'inline-block text-sm font-semibold hover:text-sunny transition-colors'
  const hover = { x: 4 }
  const trans = { type: 'spring', stiffness: 500, damping: 28 }
  if (/^https?:\/\//.test(href)) {
    return (
      <motion.a href={href} target="_blank" rel="noopener noreferrer" className={cls} whileHover={hover} transition={trans}>
        {children}
      </motion.a>
    )
  }
  if (href.startsWith('/')) {
    return (
      <MotionLink to={href} className={cls} whileHover={hover} transition={trans}>
        {children}
      </MotionLink>
    )
  }
  return (
    <motion.a href={href} className={cls} whileHover={hover} transition={trans}>
      {children}
    </motion.a>
  )
}

export default function Footer() {
  return (
    <footer className="relative bg-ink text-cream/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <Stagger className="grid md:grid-cols-[1.4fr_repeat(4,1fr)] gap-10" stagger={0.08} amount={0.2}>
          <RevealItem variants={fadeUp}>
            <div className="flex items-center gap-2.5">
              <img src={IMG.logo} alt="" className="w-9 h-9 rounded-xl" />
              <span className="font-display font-extrabold text-xl text-white">Pedagogy</span>
            </div>
            <p className="mt-3 text-sm font-semibold max-w-xs leading-relaxed">
              Stories that teach and delight. A wholesome reading adventure for kids ages 2–10.
            </p>
            <div className="mt-5 flex gap-3">
              <AppleBadge />
            </div>
          </RevealItem>

          {FOOTER_COLS.map(([h, items]) => (
            <RevealItem variants={fadeUp} key={h}>
              <div className="font-extrabold text-white text-sm">{h}</div>
              <ul className="mt-3 space-y-2">
                {items.map(([label, href]) => (
                  <li key={label}>
                    <FooterLink href={href}>{label}</FooterLink>
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </Stagger>

        <motion.div
          className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-semibold"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={vp}
          transition={{ duration: 0.6 }}
        >
          <span>© 2026 Pedagogy. Made with ❤️ for little readers.</span>
          <span className="text-cream/50">Designed for curious minds, ages 2–10.</span>
        </motion.div>
      </div>
    </footer>
  )
}
