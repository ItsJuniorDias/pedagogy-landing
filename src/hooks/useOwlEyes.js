import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

// useOwlEyes — makes the owl mascot's irises follow the pointer.
//
// The owl is a flat illustration, so we render it in three layers: `owl-base`
// (the owl with its irises painted out to clean eye-white) plus two iris
// sprites cut from the original art. This hook nudges each iris sprite toward
// the cursor every frame, clamped so the iris never slides past the white —
// which reads as the owl turning its eyes to watch you.
//
// Why imperative DOM writes instead of React state: the pointer fires dozens of
// times a second, and re-rendering the tree that often would be wasteful. We
// read the mouse in a passive listener, then a single rAF loop eases each iris
// toward its target and writes `transform` straight to the node.
//
// Desktop tracks the mouse anywhere on the page; touch devices fall back to the
// gyroscope (tilt the phone and the eyes drift). Under reduced motion the eyes
// stay centred and no listeners are attached.
//
// Returns refs to attach:
//   wrapRef  → the box wrapping owl-base + the iris sprites (its size & position
//              define each eye's home, so it must be the owl's own bounding box)
//   leftRef  → the left  iris <img>
//   rightRef → the right iris <img>
export function useOwlEyes({ left, right, maxTravel = 0.018, ease = 0.16 } = {}) {
  const reduce = useReducedMotion()

  const wrapRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)

  // Keep the latest geometry in a ref so the rAF loop always sees fresh values
  // without needing to re-run the effect when props change identity.
  const cfg = useRef({ left, right, maxTravel, ease })
  cfg.current = { left, right, maxTravel, ease }

  useEffect(() => {
    const wrap = wrapRef.current
    const lEl = leftRef.current
    const rEl = rightRef.current
    if (!wrap || !lEl || !rEl) return

    // Reduced motion: pin both irises dead-centre on their eye and bail out.
    const home = 'translate(-50%, -50%)'
    if (reduce) {
      lEl.style.transform = home
      rEl.style.transform = home
      return
    }

    // Pointer target in viewport coords. null → no pointer yet (rest at centre).
    let pointer = null
    // Per-eye smoothed offset (in px, within the eye-white).
    const cur = { l: { x: 0, y: 0 }, r: { x: 0, y: 0 } }
    let raf = 0

    const setPointerFromTilt = (e) => {
      if (e.gamma == null || e.beta == null) return
      // Map a comfortable hold into a virtual cursor floating around screen
      // centre, so tilting the phone sweeps the eyes the same way a mouse would.
      const nx = Math.max(-1, Math.min(1, e.gamma / 35)) // left / right
      const ny = Math.max(-1, Math.min(1, (e.beta - 40) / 35)) // tilt fwd / back
      pointer = {
        x: window.innerWidth / 2 + nx * window.innerWidth * 0.5,
        y: window.innerHeight / 2 + ny * window.innerHeight * 0.5,
      }
    }

    const onMove = (e) => {
      pointer = { x: e.clientX, y: e.clientY }
    }
    // When the cursor leaves the window, drift the gaze back to centre.
    const onLeave = () => {
      pointer = null
    }

    // Push one iris toward the pointer, eased. `eye` carries its home fraction.
    const aim = (el, slot, eye, rect, maxPx, k) => {
      let tx = 0
      let ty = 0
      if (pointer && eye) {
        const homeX = rect.left + eye.fx * rect.width
        const homeY = rect.top + eye.fy * rect.height
        const dx = pointer.x - homeX
        const dy = pointer.y - homeY
        const dist = Math.hypot(dx, dy)
        if (dist > 0.001) {
          // Full travel once the pointer is comfortably away; eases back toward
          // centre as it crosses the owl's face so the eyes don't twitch at
          // close range.
          const reach = maxPx * Math.min(1, dist / 200)
          tx = (dx / dist) * reach
          ty = (dy / dist) * reach
        }
      }
      slot.x += (tx - slot.x) * k
      slot.y += (ty - slot.y) * k
      el.style.transform = `translate(-50%, -50%) translate(${slot.x.toFixed(2)}px, ${slot.y.toFixed(2)}px)`
    }

    const tick = () => {
      const { left: L, right: R, maxTravel: mt, ease: k } = cfg.current
      const rect = wrap.getBoundingClientRect()
      if (rect.width) {
        const maxPx = rect.width * mt // travel scales with the owl's on-screen size
        aim(lEl, cur.l, L, rect, maxPx, k)
        aim(rEl, cur.r, R, rect, maxPx, k)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave, { passive: true })
    window.addEventListener('deviceorientation', setPointerFromTilt, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('deviceorientation', setPointerFromTilt)
    }
  }, [reduce])

  return { wrapRef, leftRef, rightRef, reduce }
}
