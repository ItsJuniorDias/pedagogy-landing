import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { STEPS } from '../data.js'
import { spring, fromLeft, fromRight, popIn, viewport as vp } from '../motion.js'

function Step({ s, i }) {
  const fromSide = s.side === 'right' ? fromRight : fromLeft
  return (
    <div className="relative py-5 md:py-7">
      {/* node on the spine */}
      <div className="absolute top-5 md:top-7 left-[31px] md:left-1/2 -translate-x-1/2 z-[2]">
        <motion.div
          className="grid place-items-center w-16 h-16 rounded-full text-2xl shadow-lg ring-4 ring-cream"
          style={{ background: s.ring }}
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={popIn}
          whileHover={{ scale: 1.12, rotate: 6 }}
        >
          <span>{s.emoji}</span>
        </motion.div>
        <motion.div
          className="absolute -bottom-1 -right-1 grid place-items-center w-6 h-6 rounded-full text-[12px] font-extrabold text-white ring-2 ring-cream"
          style={{ background: s.color }}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={vp}
          transition={{ ...spring.bouncy, delay: 0.15 }}
        >
          {i + 1}
        </motion.div>
      </div>

      {/* card */}
      <div className={'ml-[80px] md:ml-0 md:w-[42%] ' + (s.side === 'right' ? 'md:ml-auto' : '')}>
        <motion.div
          className={s.side === 'right' ? 'md:text-left' : 'md:text-right'}
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fromSide}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="rounded-3xl bg-white p-6 sm:p-7 shadow-[0_18px_40px_-26px_rgba(58,49,66,.5)] ring-1 ring-black/5"
            style={{ borderTop: '5px solid ' + s.color }}
            whileHover={{ y: -6, boxShadow: '0 26px 50px -24px rgba(58,49,66,.55)' }}
            transition={spring.press}
          >
            <h3 className="font-extrabold text-2xl text-ink">{s.title}</h3>
            <p className="mt-2 text-inksoft font-semibold leading-relaxed">{s.body}</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function StoryPath() {
  const spineRef = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: spineRef,
    offset: ['start 0.85', 'end 0.55'],
  })
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="how" className="relative py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[13px] font-extrabold tracking-wider uppercase text-bubblegum">How it works</span>
          <h2 className="mt-2 font-extrabold text-4xl sm:text-5xl text-ink leading-tight">
            A path from first sound
            <br className="hidden sm:block" /> to first story
          </h2>
          <p className="mt-4 text-lg text-inksoft font-semibold">
            Follow the trail — every lesson builds on the last, the way reading really clicks.
          </p>
        </motion.div>

        <div ref={spineRef} className="spine mt-14 max-w-4xl mx-auto">
          {/* scroll-drawn progress line over the dashed track */}
          <motion.span
            className="spine-progress"
            style={reduce ? { transform: 'scaleY(1)' } : { scaleY }}
            aria-hidden="true"
          />

          {STEPS.map((s, i) => (
            <Step key={i} s={s} i={i} />
          ))}

          {/* finish flag */}
          <div className="relative pt-2 flex md:justify-center">
            <motion.div
              className="ml-[8px] md:ml-0 grid place-items-center w-16 h-16 rounded-full bg-sunny text-2xl ring-4 ring-cream shadow-lg"
              initial={{ scale: 0, rotate: -20 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={spring.bouncy}
              whileHover={{ scale: 1.12, rotate: 8 }}
            >
              🏆
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
