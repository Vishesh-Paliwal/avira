import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://bioreactor-rag-746208330214.us-central1.run.app',
        changeOrigin: true,
        timeout: 300000,
      },
    },
  },
})
