// -----------------------------------------------------------------------------
// motion.js — the single source of truth for animation in Pedagogy.
//
// Tweak timing, springs, and distances here and the whole page follows. The
// brand is playful and bouncy (Duolingo-style), so the default feel is SPRING,
// not flat corporate easing. Reduced-motion is handled globally by
// <MotionConfig reducedMotion="user"> in main.jsx, which disables transform &
// layout animations while keeping gentle opacity fades — so these variants are
// safe to use everywhere.
// -----------------------------------------------------------------------------

// Matches the existing CSS reveal curve (cubic-bezier .2 .8 .2 1) for cohesion.
export const EASE = [0.22, 0.8, 0.2, 1]
export const EASE_OUT = [0.16, 1, 0.3, 1]

// Spring presets ------------------------------------------------------------
export const spring = {
  // Smooth, low-bounce — section content, slides.
  soft: { type: 'spring', stiffness: 120, damping: 20, mass: 0.9 },
  // Snappy pop — nodes, badges, icons appearing.
  pop: { type: 'spring', stiffness: 260, damping: 18 },
  // Extra bounce — playful accents (trophy, app icon).
  bouncy: { type: 'spring', stiffness: 380, damping: 14 },
  // Quick & tight — hover/tap micro-interactions.
  press: { type: 'spring', stiffness: 500, damping: 28 },
}

// Shared viewport config — fire once, a little before fully in view.
export const viewport = { once: true, amount: 0.25, margin: '0px 0px -10% 0px' }

// Core reveal variants ------------------------------------------------------
export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: spring.soft },
}

export const popIn = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1, transition: spring.pop },
}

export const fromLeft = {
  hidden: { opacity: 0, x: -44 },
  show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE } },
}

export const fromRight = {
  hidden: { opacity: 0, x: 44 },
  show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE } },
}

// Stagger container — children with variants "hidden"/"show" cascade in.
export const container = (stagger = 0.1, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
})

// Ambient float loops (used by <Floaty> for decorative bubbles & owl).
// Disabled automatically for reduced-motion users (they are transforms).
export const floatLoop = {
  bob: {
    animate: { y: [0, -14, 0] },
    transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
  },
  bobslow: {
    animate: { y: [0, -11, 0], rotate: [-4, 4, -4] },
    transition: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' },
  },
  sway: {
    animate: { rotate: [-6, 6, -6] },
    transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

// Hover/tap presets for cards & tiles.
export const liftHover = { y: -6, transition: spring.press }
export const tapShrink = { scale: 0.97 }
