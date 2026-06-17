import { motion } from 'framer-motion'
import {
  fadeUp,
  container,
  floatLoop,
  spring,
  viewport as vp,
  EASE,
} from '../motion.js'
import { useGetApp } from '../hooks/useGetApp.js'

/**
 * Reveal — fades children up into view on scroll (Framer Motion).
 * Same API as before (className, delay in ms, polymorphic `as`).
 * Reduced motion is honoured globally via <MotionConfig reducedMotion="user">.
 */
export function Reveal({ children, className = '', delay = 0, y = 28, as = 'div', ...rest }) {
  const M = motion[as] || motion.div
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={vp}
      transition={{ duration: 0.6, ease: EASE, delay: delay / 1000 }}
      {...rest}
    >
      {children}
    </M>
  )
}

/**
 * Stagger — a container whose direct <RevealItem> children cascade in.
 * Drive grids and lists with one orchestration instead of per-item delays.
 */
export function Stagger({
  children,
  className = '',
  as = 'div',
  stagger = 0.1,
  delayChildren = 0,
  amount = 0.2,
  ...rest
}) {
  const M = motion[as] || motion.div
  return (
    <M
      className={className}
      variants={container(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      {...rest}
    >
      {children}
    </M>
  )
}

/** A single item inside <Stagger>. Inherits the cascade from its parent. */
export function RevealItem({ children, className = '', as = 'div', variants = fadeUp, ...rest }) {
  const M = motion[as] || motion.div
  return (
    <M className={className} variants={variants} {...rest}>
      {children}
    </M>
  )
}

/**
 * Floaty — pops a decoration in (spring), then floats it forever.
 * Two nested layers keep the one-shot entrance and the infinite loop from
 * fighting over the same transform. `rotate` bakes in a resting tilt.
 */
export function Floaty({ children, variant = 'bob', rotate = 0, delay = 0, className = '', ...rest }) {
  const loop = floatLoop[variant] || floatLoop.bob
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.4, rotate }}
      whileInView={{ opacity: 1, scale: 1, rotate }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ ...spring.pop, delay: delay / 1000 }}
      {...rest}
    >
      <motion.div
        animate={loop.animate}
        transition={loop.transition}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export function AppleBadge({ className = '' }) {
  const app = useGetApp()
  return (
    <a
      {...app}
      className={'btn3d b-dark px-4 py-2.5 ' + className}
      aria-label="Download on the App Store"
    >
      <svg width="20" height="22" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM256.6 93.9c30.3-36 27.6-68.7 26.7-80.5-26.8 1.5-57.8 18.2-75.5 38.8-19.5 22.1-31 49.4-28.5 80 28.9 2.2 55.3-12.6 77.3-38.3z" />
      </svg>
      <span className="text-left leading-none">
        <span className="block text-[10px] font-body font-semibold opacity-80">Download on the</span>
        <span className="block text-[15px] -mt-px">App Store</span>
      </span>
    </a>
  )
}

export function GoogleBadge({ className = '' }) {
  const app = useGetApp()
  return (
    <a
      {...app}
      className={'btn3d b-dark px-4 py-2.5 ' + className}
      aria-label="Get it on Google Play"
    >
      <svg width="20" height="22" viewBox="0 0 512 512" aria-hidden="true">
        <path d="M48 59.49v393a4.33 4.33 0 0 0 7.37 3.07l201.32-200.62-201.32-198.6A4.33 4.33 0 0 0 48 59.49z" fill="#48c5ff" />
        <path d="M345.8 174 89.22 32.64l-.16-.09c-4.42-2.4-8.62 3.58-5 7.06l201.7 199.32z" fill="#43e695" />
        <path d="M285.75 273.13 84.06 472.39c-3.6 3.48.6 9.46 5 7.06l.16-.09L345.8 338z" fill="#ff5e6e" />
        <path d="M449.38 231.81 374.66 191l-65 64.66 65 64.66 74.72-40.8c12.83-7.03 12.83-25.69 0-32.71z" fill="#ffcf48" />
      </svg>
      <span className="text-left leading-none">
        <span className="block text-[10px] font-body font-semibold opacity-80">GET IT ON</span>
        <span className="block text-[15px] -mt-px">Google Play</span>
      </span>
    </a>
  )
}

export function Stars({ className = '' }) {
  return (
    <span className={'inline-flex gap-0.5 ' + className} aria-label="5 out of 5 stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="#FFB400"
          aria-hidden="true"
          initial={{ scale: 0, rotate: -30 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ ...spring.bouncy, delay: 0.05 * i }}
        >
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01z" />
        </motion.svg>
      ))}
    </span>
  )
}

export function Check({ color = '#16BFA6' }) {
  return (
    <motion.span
      className="shrink-0 mt-0.5 grid place-items-center w-6 h-6 rounded-full"
      style={{ background: color }}
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={spring.pop}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M20 6L9 17l-5-5"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.12 }}
        />
      </svg>
    </motion.span>
  )
}

/** Floating emoji bubble used for hero / section decoration. */
export function Bubble({ emoji, className = '', bg = '#fff', anim, variant, size = 'text-2xl', rotate = 0, delay = 0 }) {
  const map = { float: 'bob', float2: 'bobslow', sway: 'sway' }
  const v = variant || map[anim] || 'bob'
  return (
    <Floaty variant={v} rotate={rotate} delay={delay} className={'absolute ' + className} aria-hidden="true">
      <div
        className="grid place-items-center w-full h-full rounded-2xl shadow-lg"
        style={{ background: bg, boxShadow: '0 12px 24px -10px rgba(58,49,66,.35)' }}
      >
        <span className={size}>{emoji}</span>
      </div>
    </Floaty>
  )
}
