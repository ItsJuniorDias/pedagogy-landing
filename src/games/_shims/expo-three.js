// Web shim for `expo-three`'s Renderer. On native, expo-three wraps the
// expo-gl context in a THREE.WebGLRenderer; on the web we already have a real
// canvas + context, so we just build a standard WebGLRenderer from it.
//
// setSize is forced to updateStyle=false: the <canvas> sizing (CSS + backing
// store, incl. devicePixelRatio) is owned by the expo-gl shim, so THREE must
// not fight it.
import * as THREE from 'three'

export class Renderer {
  constructor({ gl }) {
    const renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    })
    renderer.setPixelRatio(1) // backing store already accounts for DPR
    const origSetSize = renderer.setSize.bind(renderer)
    renderer.setSize = (w, h) => origSetSize(w, h, false)
    return renderer
  }
}

export default { Renderer }
