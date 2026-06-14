import { motion } from 'framer-motion'
import { IMG } from '../assets.js'
import { Reveal, Stagger, RevealItem, Bubble } from './ui.jsx'
import { popIn, fromRight, spring, viewport as vp } from '../motion.js'
import { WORLDS } from '../data.js'

export default function Worlds() {
  return (
    <section
      id="stories"
      className="relative py-20 sm:py-28 bg-gradient-to-b from-transparent via-white/60 to-transparent"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
        <Reveal className="order-2 lg:order-1">
          <span className="text-[13px] font-extrabold tracking-wider uppercase text-mint">Magic stories</span>
          <h2 className="mt-2 font-extrabold text-4xl sm:text-5xl text-ink leading-tight">Explore magical worlds</h2>
          <p className="mt-4 text-lg text-inksoft font-semibold max-w-lg">
            Every story is an adventure with a lesson hidden inside. Pick a world and start reading — new tales are added
            all the time.
          </p>
          <Stagger className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3" stagger={0.07} amount={0.3}>
            {WORLDS.map((w, i) => (
              <RevealItem
                key={i}
                variants={popIn}
                className="rounded-2xl px-3 py-4 text-center ring-1 ring-black/5 shadow-sm cursor-pointer"
                style={{ background: w.bg }}
                whileHover={{ y: -6, scale: 1.04, rotate: i % 2 ? 2 : -2 }}
                whileTap={{ scale: 0.96 }}
                transition={spring.press}
              >
                <div className="text-3xl">{w.e}</div>
                <div className="mt-1.5 font-extrabold text-ink text-[15px]">{w.n}</div>
              </RevealItem>
            ))}
          </Stagger>
          <motion.a
            href="#download"
            className="btn3d b-grape px-6 py-3.5 mt-8"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={spring.press}
          >
            Start exploring
          </motion.a>
        </Reveal>

        <motion.div
          className="order-1 lg:order-2 relative"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fromRight}
        >
          <div className="relative mx-auto w-[min(300px,72vw)]">
            <div className="absolute -inset-6 rounded-[44px] bg-lilac/60 blur-2xl" aria-hidden="true" />
            <div className="phone relative">
              <div className="phone-inner">
                <div className="phone-notch" />
                <img
                  src={IMG.stories}
                  alt="Magic Stories screen with rocket and forest adventures"
                  className="w-full block"
                />
              </div>
            </div>
            <Bubble emoji="✨" bg="#FFF3D6" className="w-12 h-12 -left-5 top-10" anim="float" delay={200} />
            <Bubble emoji="🌟" bg="#E7E0FF" className="w-11 h-11 -right-4 bottom-16" anim="float2" delay={320} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
