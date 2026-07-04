import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FarmGameScreen from '../../games/farm-game/index.ts'
import { trackPlayGame } from '../../lib/pixel.js'

// Happy Farm — the React-Native/Expo 3D game ported to the web (react-native-web
// + plain three.js). It owns its own HUD and fills a fixed-height frame.
export default function Farm() {
  const frameRef = useRef(null)
  const [fs, setFs] = useState(false)        // are we currently full-screen?
  const [cssFs, setCssFs] = useState(false)  // using the CSS fallback (e.g. iOS)?

  // GamePlayed when the farm game opens.
  useEffect(() => {
    trackPlayGame({ game: 'farm' })
  }, [])

  // Does this browser support the real Fullscreen API on an element?
  const nativeSupported = useCallback(() => {
    const el = frameRef.current
    if (!el) return false
    return !!(
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.msRequestFullscreen
    )
  }, [])

  const enterNative = (el) =>
    (el.requestFullscreen?.() ||
      el.webkitRequestFullscreen?.() ||
      el.msRequestFullscreen?.())

  const exitNative = () =>
    (document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.())

  const toggleFullscreen = useCallback(async () => {
    const el = frameRef.current
    if (!el) return

    // CSS fallback path (no native support — typically iOS Safari)
    if (!nativeSupported()) {
      setCssFs((v) => {
        const next = !v
        setFs(next)
        return next
      })
      return
    }

    const current =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
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

  // For the CSS fallback: lock body scroll + allow Esc to exit.
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
            Happy Farm <span className="align-middle">🌾</span>
          </h1>
          <p className="mt-1 text-inksoft font-semibold text-sm">
            Tap tiles to till, plant, water &amp; harvest. Drag the field to find the
            house, barn &amp; beehive. Progress saves automatically.
          </p>
        </div>
        <Link to="/app/games" className="btn3d b-white px-4 py-2.5 text-sm shrink-0">
          ← Games
        </Link>
      </div>

      {/* The game uses flex:1 internally, so the frame must be a flex column
          with an explicit height. In full-screen it fills the whole viewport. */}
      <div
        ref={frameRef}
        className={
          'relative overflow-hidden flex flex-col bg-[#0b1020] ' +
          (fs
            ? 'rounded-none ring-0 shadow-none'
            : 'rounded-[28px] ring-1 ring-black/5 shadow-[0_18px_44px_-28px_rgba(58,49,66,.7)]')
        }
        style={
          cssFs
            ? {
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                height: '100dvh',
                width: '100vw',
              }
            : { height: fs ? '100vh' : 'min(82vh, 760px)' }
        }
      >
        <FarmGameScreen isFullscreen={fs} onToggleFullscreen={toggleFullscreen} />
      </div>
    </div>
  )
}
