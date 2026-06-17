// Web shim for `expo-gl`'s <GLView>.
// Renders a <canvas>, hands its WebGL2 context to onContextCreate(gl) (the same
// shape the farm game's useFarmScene expects), and translates pointer events
// into the RN-style { nativeEvent: { locationX, locationY } } the game reads.
import React, { useEffect, useRef } from 'react'

export function GLView({ onContextCreate, onTouchStart, onTouchMove, onTouchEnd, style }) {
  const canvasRef = useRef(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || startedRef.current) return
    startedRef.current = true

    const parent = canvas.parentElement

    // IMPORTANT: the canvas *display* size is owned entirely by CSS
    // (position:absolute; inset:0 → always fills the parent box). Here we only
    // keep the *backing store* (canvas.width/height, i.e. drawingBuffer) in sync
    // with the rendered size. The game's render loop watches drawingBufferWidth/
    // Height each frame and updates the renderer viewport + camera, so a correct
    // backing store is all that's needed for fullscreen / window resizes.
    const measure = () => {
      const r = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect()
      const w = Math.max(1, Math.round(r.width) || parent?.clientWidth || 320)
      const h = Math.max(1, Math.round(r.height) || parent?.clientHeight || 320)
      return { w, h }
    }
    const sync = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) // re-read: can change across monitors
      const { w, h } = measure()
      const bw = Math.floor(w * dpr)
      const bh = Math.floor(h * dpr)
      if (canvas.width !== bw) canvas.width = bw
      if (canvas.height !== bh) canvas.height = bh
    }
    sync()

    const opts = { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: false }
    const gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts)

    // Primary: ResizeObserver on the parent box.
    const ro = new ResizeObserver(sync)
    if (parent) ro.observe(parent)

    // Belt-and-suspenders: some layout changes (notably entering/leaving native
    // fullscreen) don't always deliver a timely ResizeObserver callback, so also
    // listen to window resize + fullscreen changes, and re-sync over the next few
    // frames to catch the settled post-transition layout.
    const burst = () => {
      sync()
      let n = 0
      const tick = () => { sync(); if (++n < 6) requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    }
    const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange']
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', burst)
    fsEvents.forEach((e) => document.addEventListener(e, burst))

    Promise.resolve(onContextCreate && onContextCreate(gl)).catch((e) =>
      console.error('[expo-gl shim] onContextCreate failed:', e),
    )

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', burst)
      fsEvents.forEach((e) => document.removeEventListener(e, burst))
    }
  }, [])

  const emit = (cb) => (e) => {
    if (!cb) return
    const rect = e.currentTarget.getBoundingClientRect()
    // Touch coords are in CSS pixels relative to the canvas — matches the logical
    // units the game uses for hit-testing (it scales by drawingBuffer/CSS itself).
    cb({ nativeEvent: { locationX: e.clientX - rect.left, locationY: e.clientY - rect.top } })
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      onPointerDown={(e) => {
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
        emit(onTouchStart)(e)
      }}
      onPointerMove={emit(onTouchMove)}
      onPointerUp={(e) => {
        emit(onTouchEnd)(e)
        try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
      }}
      onPointerCancel={emit(onTouchEnd)}
    />
  )
}

export default { GLView }
