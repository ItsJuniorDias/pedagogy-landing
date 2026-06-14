import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { IMG } from '../assets.js'
import { AppleBadge, GoogleBadge, Stars, Bubble } from './ui.jsx'
import { container, fadeUp, spring } from '../motion.js'

export default function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  // Scroll-linked parallax: layers drift at different speeds as the hero exits.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const owlY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60])
  const blobA = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 50])
  const blobB = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 70])
  const blobC = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40])

  return (
    <section ref={ref} id="top" className="relative pt-28 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
      {/* soft pastel blobs (parallax) */}
      <motion.div style={{ y: blobA }} className="pointer-events-none absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-lilac/70 blur-[60px]" aria-hidden="true" />
      <motion.div style={{ y: blobB }} className="pointer-events-none absolute top-10 -right-24 w-[26rem] h-[26rem] rounded-full bg-blush/70 blur-[60px]" aria-hidden="true" />
      <motion.div style={{ y: blobC }} className="pointer-events-none absolute bottom-0 left-1/3 w-[22rem] h-[22rem] rounded-full bg-sky/60 blur-[60px]" aria-hidden="true" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
        {/* copy — orchestrated load cascade */}
        <motion.div
          className="text-center lg:text-left"
          variants={container(0.12, 0.1)}
          initial="hidden"
          animate="show"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 ring-1 ring-grape/15 px-4 py-1.5 text-[13px] font-extrabold text-grape shadow-sm"
          >
            <span>🦉</span> Stories · Phonics · Curiosity for ages 2–10
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="mt-5 font-extrabold text-ink leading-[0.98] tracking-tight text-[2.6rem] sm:text-6xl"
          >
            Stories that <span className="text-grape">teach</span>
            <br className="hidden sm:block" /> and{' '}
            <span className="relative inline-block text-bubblegum">
              delight
              <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none" aria-hidden="true">
                <motion.path
                  d="M3 8c40-6 154-6 194 0"
                  stroke="#FFD42E"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, ease: 'easeInOut', delay: 0.75 }}
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-[1.06rem] sm:text-xl text-inksoft font-semibold max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Pedagogy turns screen time into <span className="text-ink font-extrabold">story time</span>. Bite-sized lessons,
            magical adventures, and playful games help your child learn to read — and love it.
          </motion.p>

          <motion.div
            variants={fadeUp}
            id="download"
            className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3"
          >
            <motion.a
              href="#pricing"
              className="btn3d b-pink px-7 py-4 text-lg"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={spring.press}
            >
              Download free
            </motion.a>
            <AppleBadge />
            <GoogleBadge />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm font-bold text-inksoft"
          >
            <span className="inline-flex items-center gap-1.5">
              <Stars /> <span className="text-ink">4.9</span> on the App Store
            </span>
            <span className="inline-flex items-center gap-1.5">❤️ Loved by 50,000+ families</span>
            <span className="inline-flex items-center gap-1.5">🛡️ 100% ad-free</span>
          </motion.div>
        </motion.div>

        {/* owl scene */}
        <div className="relative">
          <div className="relative mx-auto w-[min(440px,86vw)] aspect-square">
            {/* spotlight */}
            <div className="absolute inset-3 rounded-[42%] bg-gradient-to-b from-white/80 to-butter/60 blur-[2px]" aria-hidden="true" />
            <div className="absolute inset-0 rounded-[42%] ring-2 ring-white/60" aria-hidden="true" />

            {/* phone peeking behind */}
            <motion.div
              className="phone absolute -right-2 sm:right-2 bottom-2 w-[34%] rotate-6 hidden sm:block"
              initial={{ opacity: 0, x: 40, rotate: 12 }}
              animate={{ opacity: 1, x: 0, rotate: 6 }}
              transition={{ ...spring.soft, delay: 0.5 }}
            >
              <div className="phone-inner">
                <div className="phone-notch" />
                <img src={IMG.home} alt="Pedagogy app home screen" className="w-full block" />
              </div>
            </motion.div>

            {/* owl: entrance + parallax (outer) → continuous float (inner) */}
            <motion.div
              style={{ y: owlY }}
              className="relative z-[1]"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring.soft, delay: 0.2 }}
            >
              <motion.img
                src={IMG.owl}
                alt="Pedagogy the owl reading a storybook"
                className="w-[88%] mx-auto drop-shadow-[0_20px_30px_rgba(58,49,66,.25)]"
                animate={{ y: [0, -12, 0], rotate: [-1.5, 1.5, -1.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* floating story bits (pop in, then float) */}
            <Bubble emoji="⭐" bg="#FFF3D6" className="w-12 h-12 left-0 top-6" rotate={-12} anim="float" delay={650} />
            <Bubble emoji="🚀" bg="#E7E0FF" className="w-14 h-14 -right-1 top-2" anim="float2" delay={750} />
            <Bubble emoji="🅰️" bg="#FFE3EC" className="w-12 h-12 left-2 bottom-8" anim="float2" delay={850} />
            <Bubble emoji="📖" bg="#DFF6E8" className="w-12 h-12 right-6 -bottom-1" anim="float" delay={950} />
            <Bubble emoji="🪐" bg="#DDEFFF" className="w-11 h-11 left-1/2 -top-2" anim="float" size="text-xl" delay={550} />
          </div>
        </div>
      </div>
    </section>
  )
}
