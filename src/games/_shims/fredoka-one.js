// Web shim for @expo-google-fonts/fredoka-one. We register the bundled Fredoka
// woff2 under the exact family name the StyleSheet uses ("FredokaOne_400Regular"),
// so the rounded look survives the port with no network dependency. Vite resolves
// this import to a hashed asset URL at build time.
import woff2Url from '@fontsource/fredoka/files/fredoka-latin-400-normal.woff2'

let injected = false
function inject() {
  if (injected || typeof document === 'undefined') return
  injected = true
  try {
    const face = new FontFace('FredokaOne_400Regular', `url(${woff2Url})`, {
      weight: '400',
      display: 'swap',
    })
    face.load().then((f) => document.fonts.add(f)).catch(() => {})
  } catch {}
}
inject()

export const FredokaOne_400Regular = 'FredokaOne_400Regular'
export function useFonts() {
  return [true, null]
}

export default { useFonts, FredokaOne_400Regular }
