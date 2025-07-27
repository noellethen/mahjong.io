import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "https://mahjong-io-backend-m2gh.onrender.com",
        changeOrigin: true,
        secure: false,
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
