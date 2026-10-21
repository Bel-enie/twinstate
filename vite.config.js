import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import annotations from './scripts/annotations-plugin.mjs'

// https://vitejs.dev/config/
export default defineConfig({
  // annotations() only runs on the dev server: it stores notes made with the
  // in-browser annotate mode in .annotations/notes.json.
  plugins: [react(), annotations()],
  server: {
    port: 5173,
    open: true,
  },
})
