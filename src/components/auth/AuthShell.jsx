import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IMG } from '../../assets.js'
import { Bubble } from '../ui.jsx'
import { spring } from '../../motion.js'

/**
 * AuthShell — the shared frame for Login & Signup.
 * Left: a playful brand panel with the owl (desktop only).
 * Right: the form card. Decorative bubbles float behind everything.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#FFF4E8] via-cream to-[#F3EEFF]">
      {/* soft pastel blobs */}
      <div className="pointer-events-none absolute -top-24 -left-20 w-[26rem] h-[26rem] rounded-full bg-lilac/60 blur-[70px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 w-[24rem] h-[24rem] rounded-full bg-blush/60 blur-[70px]" aria-hidden="true" />

      {/* floating decorations */}
      <Bubble emoji="⭐" bg="#FFF3D6" className="w-12 h-12 left-[8%] top-[18%] hidden sm:flex" rotate={-10} anim="float" delay={300} />
      <Bubble emoji="📖" bg="#DFF6E8" className="w-12 h-12 right-[10%] top-[14%]" anim="float2" delay={420} />
      <Bubble emoji="🚀" bg="#E7E0FF" className="w-12 h-12 right-[14%] bottom-[12%] hidden sm:flex" anim="float" delay={520} />

      <div className="relative min-h-screen grid lg:grid-cols-2">
        {/* brand panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16">
          <Link to="/" className="flex items-center gap-2.5 w-fit">
            <img src={IMG.logo} alt="" className="w-9 h-9 rounded-xl shadow-sm ring-1 ring-black/5" />
            <span className="font-display font-extrabold text-xl text-ink tracking-tight">Pedagogy</span>
          </Link>

          <div className="max-w-md">
            <motion.img
              src={IMG.owl}
              alt="Pedagogy the owl"
              className="w-56 mb-6 drop-shadow-[0_20px_30px_rgba(58,49,66,.22)]"
              animate={{ y: [0, -12, 0], rotate: [-1.5, 1.5, -1.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <h2 className="font-extrabold text-4xl text-ink leading-tight">
              Where screen time becomes <span className="text-grape">story time</span>.
            </h2>
            <p className="mt-4 text-lg text-inksoft font-semibold">
              Pick up right where your little reader left off — lessons, stories, and games, all in one happy place.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/80 ring-1 ring-grape/15 px-4 py-2 shadow-sm">
              <span aria-hidden="true">🌍</span>
              <span className="font-bold text-ink text-sm">Ad-free · 7 languages · Ages 2–10</span>
            </div>
          </div>

          <p className="text-sm font-bold text-inksoft">🛡️ Safe & ad-free · Made with educators</p>
        </div>

        {/* form panel */}
        <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
          {/* mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-7">
            <img src={IMG.logo} alt="" className="w-9 h-9 rounded-xl shadow-sm ring-1 ring-black/5" />
            <span className="font-display font-extrabold text-xl text-ink tracking-tight">Pedagogy</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.soft, delay: 0.05 }}
            className="w-full max-w-md rounded-[28px] bg-white p-7 sm:p-9 shadow-[0_30px_60px_-30px_rgba(58,49,66,.5)] ring-1 ring-black/5"
          >
            <h1 className="font-extrabold text-3xl text-ink tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-inksoft font-semibold">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </motion.div>

          {footer && <div className="mt-6 text-center font-bold text-inksoft">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
