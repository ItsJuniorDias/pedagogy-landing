// Centralised "where does 'get the app' go?" logic.
//
// Product rule (from the team):
//   • iOS device      → App Store listing (the native app lives there)
//   • Android device  → /login  (no native Android app yet → use the web app)
//   • desktop / other → App Store listing (default)
//
// Everything funnels through resolveAppTarget(), so changing this behaviour
// later means editing one function — not every button on the page.

/** The published Pedagogy iOS app. */
export const APP_STORE_URL =
  'https://apps.apple.com/us/app/pedagogy-kids-books/id6776011454'

/** Where non-iOS-app visitors (Android today) are sent instead. */
export const FALLBACK_ROUTE = '/login'

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
 * Resolve the destination for any "get the app" CTA.
 *
 * @returns {{ external: boolean, to: string }}
 *   external === true  → `to` is a full URL (open it directly)
 *   external === false → `to` is an in-app route (use the router)
 *
 * To send desktop visitors into the web app instead of the App Store,
 * change the final `return` to: `{ external: false, to: FALLBACK_ROUTE }`.
 */
export function resolveAppTarget() {
  if (isAndroid()) return { external: false, to: FALLBACK_ROUTE }
  return { external: true, to: APP_STORE_URL }
}
