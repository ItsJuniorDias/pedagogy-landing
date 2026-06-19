// Central asset registry — Vite hashes & optimizes these at build time.
// Swap any file in ./assets to rebrand the whole page.
import logo from './assets/logo.jpg'
import owl from './assets/owl.png'
import owlBase from './assets/owl-base.png'
import owlIrisLeft from './assets/owl-iris-left.png'
import owlIrisRight from './assets/owl-iris-right.png'
import home from './assets/screen-home.jpg'
import stories from './assets/screen-stories.jpg'
import lesson from './assets/screen-lesson.jpg'
import path from './assets/screen-path.jpg'
import appIcon from './assets/app-icon.png'

export const IMG = { logo, owl, owlBase, owlIrisLeft, owlIrisRight, home, stories, lesson, path, appIcon }

// Geometry of the owl's eyes as fractions of the owl image (480×492).
// Used by the Hero to overlay cursor-tracking iris sprites on owl-base.
// cx/cy = iris centre; r = iris-sprite size; all as a fraction of the owl box.
export const OWL_EYES = {
  spriteFrac: 54 / 480, // iris sprite is 54px square on the 480px-wide owl
  left:  { fx: 195 / 480, fy: 145 / 492 },
  right: { fx: 297 / 480, fy: 142 / 492 },
}
