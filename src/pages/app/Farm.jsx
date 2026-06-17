import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FarmGameScreen from '../../games/farm-game/index.ts'

// Happy Farm — the React-Native/Expo 3D game ported to the web (react-native-web
// + plain three.js). It owns its own HUD and fills a fixed-height frame.
export default function Farm() {
  const frameRef = useRef(null)
  const [fs, setFs] = useState(false)        // are we currently full-screen?
  const [cssFs, setCssFs] = useState(false)  // using the CSS fallback (e.g. iOS)?

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
        <FarmGameScreen />

        {/* Fullscreen toggle — floats over the game HUD. */}
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fs ? 'Sair da tela cheia' : 'Tela cheia'}
          title={fs ? 'Sair da tela cheia (Esc)' : 'Tela cheia'}
          style={{
            position: 'absolute',
            top: 'max(12px, env(safe-area-inset-top))',
            right: 'max(12px, env(safe-area-inset-right))',
            zIndex: 50,
            width: 42,
            height: 42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            background: 'rgba(17,20,38,.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            boxShadow: '0 4px 14px -6px rgba(0,0,0,.6)',
          }}
        >
          {fs ? (
            // exit / contract
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3v3a3 3 0 0 1-3 3H3M21 9h-3a3 3 0 0 1-3-3V3M3 15h3a3 3 0 0 1 3 3v3M15 21v-3a3 3 0 0 1 3-3h3" />
            </svg>
          ) : (
            // enter / expand
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
