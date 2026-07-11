// Centralised "where does a CTA go?" logic.
//
// Product rule (revised for the web-subscription funnel):
//   • iOS device      → App Store listing (native app + StoreKit in-app purchase)
//   • Android device  → web app (no native Android app → use the browser)
//   • desktop / other → web app  ← CHANGED: was App Store. Desktop ad clicks can
//                        never reach the Mercado Pago checkout on the App Store,
//                        so they must land on the web app instead.
//
// Everything funnels through resolveAppTarget() / resolveSubscribeTarget(), so
// changing this behaviour later means editing one place — not every button.

/** The published Pedagogy iOS app. */
export const APP_STORE_URL =
  'https://apps.apple.com/us/app/pedagogy-kids-books/id6776011454'

/** Free web-app entry for non-iOS visitors. Cold ad traffic converts better on
 *  /signup than on /login (a login page for an account they don't have yet). */
export const FALLBACK_ROUTE = '/signup'

/**
 * Best-effort detection of the visitor's mobile OS.
 * Returns 'ios' | 'android' | 'other'.
 */
export function getMobileOS() {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent || navigator.vendor || ''

  // Android phones & tablets.
  if (/android/i.test(ua)) return 'android'

  // Classic iOS user agents.
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'

  // iPadOS 13+ reports as desktop Safari ("MacIntel"), so a Mac platform
  // string + a touch screen is, in practice, an iPad.
  if (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1) {
    return 'ios'
  }

  return 'other'
}

export const isAndroid = () => getMobileOS() === 'android'
export const isIOS = () => getMobileOS() === 'ios'

/**
 * Destination for a generic "get the app" (FREE) CTA — hero, badges, sticky bar.
 *
 * @returns {{ external: boolean, to: string }}
 *   external === true  → `to` is a full URL (open it directly, new tab)
 *   external === false → `to` is an in-app route (use the router)
 *
 * iOS → App Store. Everyone else (Android AND desktop) → the web app.
 */
export function resolveAppTarget() {
  if (isIOS()) return { external: true, to: APP_STORE_URL }
  return { external: false, to: FALLBACK_ROUTE }
}

/**
 * Destination for a SUBSCRIPTION CTA (the pricing cards). This is the paid path,
 * so it must reach the checkout as directly as possible:
 *   • iOS → App Store (subscriptions happen via native in-app purchase there)
 *   • Android / desktop → /premium?plan=… (the public web paywall → Mercado Pago)
 *
 * Sending paid intent straight to /premium is what collapses the old
 * download → login → signup → browse → locked-item → paywall funnel into a
 * single step, so InitiateCheckout finally gets enough volume to optimise on.
 */
export function resolveSubscribeTarget(planId = 'annual') {
  if (isIOS()) return { external: true, to: APP_STORE_URL }
  const plan = planId === 'monthly' ? 'monthly' : 'annual'
  return { external: false, to: `/premium?plan=${plan}` }
}
