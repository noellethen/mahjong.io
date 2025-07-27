import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  // build: {
  //   rollupOptions: {
  //     input: {
  //       login: resolve(__dirname, "index.html"),
  //       gamemode: resolve(__dirname, "gamemode.html"),
  //       quizmode: resolve(__dirname, "quizmode.html"),
  //     },
  //   },
  // },
});
