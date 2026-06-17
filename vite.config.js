import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const shim = (p) => path.resolve(__dirname, p)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  // .glb 3D models (farm game) → import returns the asset URL string
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  define: {
    __DEV__: false,
    global: 'globalThis',
  },
  resolve: {
    // React Native (farm game) runs on the web via react-native-web, and the
    // Expo-specific modules are mapped to tiny web shims under src/games/_shims.
    // Order matters: specific packages first, the bare `react-native` last.
    alias: [
      { find: 'expo-gl', replacement: shim('src/games/_shims/expo-gl.jsx') },
      { find: 'expo-three', replacement: shim('src/games/_shims/expo-three.js') },
      { find: 'expo-asset', replacement: shim('src/games/_shims/expo-asset.js') },
      { find: 'expo-blur', replacement: shim('src/games/_shims/expo-blur.jsx') },
      { find: '@expo-google-fonts/fredoka-one', replacement: shim('src/games/_shims/fredoka-one.js') },
      { find: '@react-native-async-storage/async-storage', replacement: shim('src/games/_shims/async-storage.js') },
      { find: 'react-native-safe-area-context', replacement: shim('src/games/_shims/safe-area.jsx') },
      { find: /^react-native$/, replacement: 'react-native-web' },
    ],
    dedupe: ['react', 'react-dom', 'react-reconciler', 'scheduler', 'three'],
  },
  optimizeDeps: {
    // react-native-web ships ESM that benefits from pre-bundling
    include: ['react-native-web'],
  },
})
