import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build:{
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'index.html'),
        gamemode: resolve(__dirname, 'gamemode.html'),
        quizmode: resolve(__dirname, 'quizmode.html'),
      }
    }
  }
})
