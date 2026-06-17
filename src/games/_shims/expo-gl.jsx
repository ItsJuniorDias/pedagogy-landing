// Web shim for `expo-gl`'s <GLView>.
// Renders a <canvas>, hands its WebGL2 context to onContextCreate(gl) (the same
// shape the farm game's useFarmScene expects), and translates pointer events
// into the RN-style { nativeEvent: { locationX, locationY } } the game reads.
import React, { useEffect, useRef } from 'react'

export function GLView({ onContextCreate, onTouchStart, onTouchMove, onTouchEnd }) {
  const canvasRef = useRef(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || startedRef.current) return
    startedRef.current = true

    const parent = canvas.parentElement
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const sync = () => {
      const w = Math.max(1, parent?.clientWidth || canvas.clientWidth || 320)
      const h = Math.max(1, parent?.clientHeight || canvas.clientHeight || 320)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
    }
    sync()

    const opts = { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: false }
    const gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts)

    // The render loop reads gl.drawingBufferWidth/Height every frame, so simply
    // resizing the backing store here is enough for the scene to follow along.
    const ro = new ResizeObserver(sync)
    if (parent) ro.observe(parent)

    Promise.resolve(onContextCreate && onContextCreate(gl)).catch((e) =>
      console.error('[expo-gl shim] onContextCreate failed:', e),
    )

    return () => ro.disconnect()
  }, [])

  const emit = (cb) => (e) => {
    if (!cb) return
    const rect = e.currentTarget.getBoundingClientRect()
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
