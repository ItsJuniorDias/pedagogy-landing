import { useEffect, useRef } from 'react'
import { useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

// usePopupParallax — pointer + device-tilt tracker for the "pop-up storybook"
// hero. Returns a spring-smoothed pointer offset (px, py ≈ -0.5..0.5 from the
// element's center) that drives the scene's 3D tilt. On touch devices the same
// values are fed by the gyroscope, so tilting the phone angles the page like a
// real pop-up book.
//
// The springs are tuned playful — they track the cursor but land with a gentle
// bounce, matching the brand's Duolingo-style feel. Everything no-ops under
// reduced motion (no listeners, values stay at rest), since MotionConfig only
// disables variant/animate transforms, not style-bound motion values.
export function usePopupParallax() {
  const reduce = useReducedMotion()
  const ref = useRef(null)

  const pxRaw = useMotionValue(0)
  const pyRaw = useMotionValue(0)

  // Bouncy-but-trackable: a touch of overshoot so the page feels alive.
  const cfg = { stiffness: 150, damping: 16, mass: 0.8 }
  const px = useSpring(pxRaw, cfg)
  const py = useSpring(pyRaw, cfg)

  useEffect(() => {
    const el = ref.current
    if (reduce || !el) return

    const clamp = (v) => Math.max(-0.5, Math.min(0.5, v))
    let frame = 0

    const apply = (cx, cy) => {
      const r = el.getBoundingClientRect()
      pxRaw.set(clamp((cx - (r.left + r.width / 2)) / r.width))
      pyRaw.set(clamp((cy - (r.top + r.height / 2)) / r.height))
    }

    // Coalesce rapid pointer events into one read per frame.
    const onMove = (e) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => apply(e.clientX, e.clientY))
    }

    // Ease the page back to its resting, face-on position.
    const onLeave = () => {
      pxRaw.set(0)
      pyRaw.set(0)
    }

    // Mobile: map device tilt into the same normalized space.
    // gamma ≈ left/right, beta ≈ front/back, recentred around a comfy hold.
    const onTilt = (e) => {
      if (e.gamma == null || e.beta == null) return
      pxRaw.set(clamp(e.gamma / 40))
      pyRaw.set(clamp((e.beta - 40) / 40))
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })
    window.addEventListener('deviceorientation', onTilt, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('deviceorientation', onTilt)
    }
  }, [reduce, pxRaw, pyRaw])

  return { ref, px, py, reduce }
}
