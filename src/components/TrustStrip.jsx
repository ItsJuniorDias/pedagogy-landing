import { useRef, useEffect, useMemo } from 'react'
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
  useReducedMotion,
} from 'framer-motion'
import { Reveal, Stagger, RevealItem } from './ui.jsx'
import { popIn, EASE } from '../motion.js'
import { STATS } from '../data.js'

/**
 * CountUp — tweens the numeric part of a stat from 0 to its value when it
 * scrolls into view, preserving any prefix/suffix (e.g. "4.9★", "50k+").
 * Reduced-motion users see the final value immediately.
 */
function CountUp({ raw }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })

  const parsed = useMemo(() => {
    const m = String(raw).match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/)
    if (!m) return null
    const decimals = m[2].includes('.') ? m[2].split('.')[1].length : 0
    return { prefix: m[1], target: parseFloat(m[2]), suffix: m[3], decimals }
  }, [raw])

  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) =>
    parsed ? parsed.prefix + v.toFixed(parsed.decimals) + parsed.suffix : String(raw)
  )

  useEffect(() => {
    if (!parsed || !inView) return
    if (reduce) {
      mv.set(parsed.target)
      return
    }
    const controls = animate(mv, parsed.target, { duration: 1.4, ease: EASE })
    return () => controls.stop()
  }, [inView, parsed, reduce, mv])

  if (!parsed) return <span ref={ref}>{raw}</span>
  return <motion.span ref={ref}>{text}</motion.span>
}

export default function TrustStrip() {
  return (
    <section className="relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Reveal className="rounded-3xl bg-white shadow-[0_18px_40px_-24px_rgba(58,49,66,.45)] ring-1 ring-black/5 px-6 py-6">
          <Stagger className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4" stagger={0.12} amount={0.4}>
            {STATS.map(([big, small], i) => (
              <RevealItem
                key={i}
                variants={popIn}
                className={'text-center ' + (i < 3 ? 'sm:border-r sm:border-black/5' : '')}
              >
                <div className="font-extrabold text-3xl sm:text-4xl text-grape leading-none">
                  <CountUp raw={big} />
                </div>
                <div className="mt-1.5 text-[13px] font-bold text-inksoft">{small}</div>
              </RevealItem>
            ))}
          </Stagger>
        </Reveal>
      </div>
    </section>
  )
}
