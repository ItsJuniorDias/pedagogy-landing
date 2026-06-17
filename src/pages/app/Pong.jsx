import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PongHub from '../../games/pong-game/index.ts'

// Neon Pong — the React-Native/Expo 3D game ported to the web (react-native-web
// + plain three.js), exactly like Happy Farm. PongHub owns the whole experience:
// a start menu → Solo vs CPU OR online Multiplayer (lobby → live match against a
// real human, relayed by the hosted server) → persistent ranking. It uses
// flex:1 internally, so the frame must be a flex column with an explicit height.
export default function Pong() {
  const frameRef = useRef(null)
  const [fs, setFs] = useState(false)        // native fullscreen active?
  const [cssFs, setCssFs] = useState(false)  // CSS fallback (e.g. iOS Safari)?

  const nativeSupported = useCallback(() => {
    const el = frameRef.current
    if (!el) return false
    return !!(el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)
  }, [])

  const enterNative = (el) =>
    (el.requestFullscreen?.() || el.webkitRequestFullscreen?.() || el.msRequestFullscreen?.())
  const exitNative = () =>
    (document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.msExitFullscreen?.())

  const toggleFullscreen = useCallback(async () => {
    const el = frameRef.current
    if (!el) return
    if (!nativeSupported()) {
      setCssFs((v) => {
        const next = !v
        setFs(next)
        return next
      })
      return
    }
    const current =
      document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement
    try {
      if (current) await exitNative()
      else await enterNative(el)
    } catch {
      /* user gesture / permission issues — ignore */
    }
  }, [nativeSupported])

  // Keep state in sync with the browser (Esc key, system gestures, etc.)
  useEffect(() => {
    const onChange = () => {
      const active = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      )
      setFs(active)
    }
    const evs = ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange']
    evs.forEach((e) => document.addEventListener(e, onChange))
    return () => evs.forEach((e) => document.removeEventListener(e, onChange))
  }, [])

  // CSS fallback: lock body scroll + allow Esc to exit.
  useEffect(() => {
    if (!cssFs) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setCssFs(false)
        setFs(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [cssFs])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
            Neon Pong <span className="align-middle">🏓</span>
          </h1>
          <p className="mt-1 text-inksoft font-semibold text-sm">
            Play Solo vs the CPU or go Online — the lobby matches you with a real
            player. Drag to move your paddle, swipe sideways to curve the ball.
          </p>
        </div>
        <Link to="/app/games" className="btn3d b-white px-4 py-2.5 text-sm shrink-0">
          ← Games
        </Link>
      </div>

      <div
        ref={frameRef}
        className={
          'relative overflow-hidden flex flex-col bg-[#0B1026] ' +
          (fs
            ? 'rounded-none ring-0 shadow-none'
            : 'rounded-[28px] ring-1 ring-black/5 shadow-[0_18px_44px_-28px_rgba(58,49,66,.7)]')
        }
        style={
          cssFs
            ? { position: 'fixed', inset: 0, zIndex: 9999, height: '100dvh', width: '100vw' }
            : { height: fs ? '100vh' : 'min(82vh, 760px)' }
        }
      >
        <PongHub />

        {/* Lightweight fullscreen toggle — bottom-left so it never collides with
            PongHub's own exit (top-right) / rank (top-left) / control bar. */}
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fs ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="absolute left-3 bottom-3 z-30 h-9 w-9 rounded-full grid place-items-center
                     text-white/90 text-sm bg-white/10 ring-1 ring-white/20 backdrop-blur
                     hover:bg-white/20 transition"
          style={{ fontFamily: 'system-ui' }}
        >
          {fs ? '🗗' : '⛶'}
        </button>
      </div>
    </div>
  )
}
