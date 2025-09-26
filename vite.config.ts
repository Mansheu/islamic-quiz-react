import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // Remove the restrictive COEP header that blocks Firebase
      // 'Cross-Origin-Embedder-Policy': 'require-corp' // This was blocking Firebase popups
    },
    cors: true
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // Remove the restrictive COEP header that blocks Firebase
      // 'Cross-Origin-Embedder-Policy': 'require-corp' // This was blocking Firebase popups
    },
    cors: true
  }
})
