import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveAppTarget } from '../device.js'
import { trackDownloadClick } from '../lib/pixel.js'

/**
 * Props for any "get the app" CTA — spread the result onto an
 * <a> / <motion.a> and drop the old `href`:
 *
 *   const app = useGetApp()
 *   <motion.a {...app} className="btn3d b-pink">Download free</motion.a>
 *
 * • iOS / desktop → opens the App Store (in a new tab, so the site stays open)
 * • Android       → routes to /login as a fast in-app (SPA) transition
 *
 * `href` is always set to the resolved destination, so right-click,
 * middle-click and "open in new tab" all behave correctly.
 */
export function useGetApp({ placement, cta, plan } = {}) {
  const navigate = useNavigate()
  const target = resolveAppTarget()

  const onClick = useCallback(
    (e) => {
      // Track the download intent before we navigate. Fires for both the App
      // Store (external) and the web-app fallback so no click is lost.
      trackDownloadClick({
        placement,
        cta,
        plan,
        destination: target.external ? 'app_store' : 'web_app',
      })
      // External (App Store): let the browser follow the href normally.
      if (target.external) return
      // Internal route: keep it a client-side navigation, no full reload.
      e.preventDefault()
      navigate(target.to)
    },
    [navigate, target.external, target.to, placement, cta, plan],
  )

  return {
    href: target.to,
    onClick,
    ...(target.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  }
}
