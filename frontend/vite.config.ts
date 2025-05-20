import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
