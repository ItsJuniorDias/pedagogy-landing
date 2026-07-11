import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveSubscribeTarget } from '../device.js'
import { trackDownloadClick } from '../lib/pixel.js'

/**
 * Props for a SUBSCRIPTION CTA (the pricing cards). Spread onto an <a>/<motion.a>:
 *
 *   const sub = useSubscribe({ placement: 'pricing', cta: 'start_annual', plan: 'annual' })
 *   <motion.a {...sub} className="btn3d b-sun">Start annual</motion.a>
 *
 * • iOS → App Store (subscription is a native in-app purchase there)
 * • Android / desktop → /premium?plan=… (public web paywall → Mercado Pago)
 *
 * This is intentionally NOT the email-gated get-the-app flow: the paid path
 * should reach checkout with the fewest steps possible. The click is logged as
 * an upper-funnel `DownloadClick` (intent); the real `InitiateCheckout` fires on
 * /premium when the visitor taps Subscribe.
 */
export function useSubscribe({ placement, cta, plan } = {}) {
  const target = resolveSubscribeTarget(plan)
  const navigate = useNavigate()

  const onClick = useCallback(
    (e) => {
      e.preventDefault()
      trackDownloadClick({
        placement,
        cta,
        plan,
        destination: target.external ? 'app_store' : 'web_app',
      })
      if (target.external) {
        window.open(target.to, '_blank', 'noopener,noreferrer')
      } else {
        navigate(target.to)
      }
    },
    [target.external, target.to, placement, cta, plan, navigate],
  )

  return {
    href: target.to,
    onClick,
    ...(target.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  }
}
