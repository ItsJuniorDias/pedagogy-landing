import { motion } from 'framer-motion'
import { Reveal, Stagger, RevealItem } from './ui.jsx'
import { fadeUp, scaleIn, spring, viewport as vp } from '../motion.js'
import { BENEFITS, FOUNDER } from '../data.js'

export default function ParentsLove() {
  return (
    <section id="parents" className="relative py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className="text-[13px] font-extrabold tracking-wider uppercase text-grape">For grown-ups</span>
          <h2 className="mt-2 font-extrabold text-4xl sm:text-5xl text-ink leading-tight">
            Built for kids, trusted by parents
          </h2>
          <p className="mt-4 text-lg text-inksoft font-semibold">
            Everything about Pedagogy is designed to be wholesome, effective, and worry-free.
          </p>
        </Reveal>

        <Stagger className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5" stagger={0.1} amount={0.2}>
          {BENEFITS.map((c, i) => (
            <RevealItem
              key={i}
              variants={fadeUp}
              className="h-full rounded-3xl bg-white p-6 ring-1 ring-black/5 shadow-[0_18px_40px_-28px_rgba(58,49,66,.5)]"
              whileHover={{ y: -8, boxShadow: '0 28px 52px -26px rgba(58,49,66,.55)' }}
              transition={spring.press}
            >
              <motion.div
                className="grid place-items-center w-14 h-14 rounded-2xl text-3xl"
                style={{ background: c.bg }}
                whileHover={{ rotate: -8, scale: 1.08 }}
                transition={spring.press}
              >
                {c.e}
              </motion.div>
              <h3 className="mt-4 font-extrabold text-xl text-ink">{c.t}</h3>
              <p className="mt-2 text-inksoft font-semibold leading-relaxed text-[15px]">{c.b}</p>
            </RevealItem>
          ))}
        </Stagger>

        {/* founder note — honest, and a real differentiator vs data-hungry apps */}
        <motion.figure
          className="mt-10 rounded-3xl bg-gradient-to-br from-grape to-graped text-white p-8 sm:p-10 text-center max-w-3xl mx-auto shadow-xl"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={scaleIn}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-wider text-white/90">
            <span aria-hidden="true">🦉</span> A note from the developer
          </span>
          <blockquote className="mt-4 font-display font-bold text-2xl sm:text-[1.9rem] leading-snug">
            {FOUNDER.quote}
          </blockquote>
          <figcaption className="mt-4 font-bold text-white/80">{FOUNDER.author}</figcaption>
        </motion.figure>
      </div>
    </section>
  )
}
