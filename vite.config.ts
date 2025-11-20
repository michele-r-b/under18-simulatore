import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/matchshare': {
        target: 'https://srv6.matchshare.it',
        changeOrigin: true,
        secure: false,
        // 👇 AGGIUNGI QUESTO
        rewrite: (path) => path.replace(/^\/matchshare/, ''),
      },
    },
  },
});