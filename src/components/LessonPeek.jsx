import { motion } from 'framer-motion'
import { IMG } from '../assets.js'
import { Stagger, RevealItem, Bubble, Check } from './ui.jsx'
import { fromLeft, fromRight, fadeUp, viewport as vp } from '../motion.js'
import { LESSON_POINTS } from '../data.js'

const CHECK_COLORS = ['#FF4D87', '#6D4BE0', '#16BFA6']

export default function LessonPeek() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
        <motion.div
          className="relative order-1"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fromLeft}
        >
          <div className="relative mx-auto w-[min(300px,72vw)]">
            <div className="absolute -inset-6 rounded-[44px] bg-blush/70 blur-2xl" aria-hidden="true" />
            <div className="phone relative -rotate-2">
              <div className="phone-inner">
                <div className="phone-notch" />
                <img
                  src={IMG.lesson}
                  alt="Lesson screen teaching the letter A with Arlo the Ant"
                  className="w-full block"
                />
              </div>
            </div>
            <Bubble emoji="🅰️" bg="#FFE3EC" className="w-14 h-14 -right-5 top-8" anim="float2" delay={200} />
            <Bubble emoji="🐜" bg="#DFF6E8" className="w-12 h-12 -left-4 bottom-10" anim="float" delay={320} />
          </div>
        </motion.div>

        <motion.div
          className="order-2"
          initial="hidden"
          whileInView="show"
          viewport={vp}
          variants={fromRight}
        >
          <span className="text-[13px] font-extrabold tracking-wider uppercase text-tangerine">Inside a lesson</span>
          <h2 className="mt-2 font-extrabold text-4xl sm:text-5xl text-ink leading-tight">
            Learning that feels
            <br className="hidden sm:block" /> like play
          </h2>
          <p className="mt-4 text-lg text-inksoft font-semibold max-w-lg">
            Take the very first letter. “A stands tall with its two legs and a little belt in the middle. Say it with me:
            Ahhh.” That's how a lesson sounds in Pedagogy.
          </p>
          <Stagger as="ul" className="mt-7 space-y-4" stagger={0.12} amount={0.4}>
            {LESSON_POINTS.map(([t, b], i) => (
              <RevealItem as="li" key={i} variants={fadeUp} className="flex gap-3">
                <Check color={CHECK_COLORS[i]} />
                <div>
                  <div className="font-extrabold text-ink text-lg">{t}</div>
                  <div className="text-inksoft font-semibold">{b}</div>
                </div>
              </RevealItem>
            ))}
          </Stagger>
        </motion.div>
      </div>
    </section>
  )
}
