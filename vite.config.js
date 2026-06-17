import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // If you deploy to a sub-path (e.g. GitHub Pages project site), set base: '/<repo>/'
  base: "./",
  // Ensure a single copy of React (and the three stack) is used. React Three
  // Fiber runs its own react-reconciler, which breaks if Vite pre-bundles a
  // second React instance.
  resolve: {
    dedupe: ["react", "react-dom", "react-reconciler", "scheduler", "three"],
  },
});
