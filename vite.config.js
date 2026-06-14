import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // If you deploy to a sub-path (e.g. GitHub Pages project site), set base: '/<repo>/'
  base: './',
})
