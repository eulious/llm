import { defineConfig, loadEnv } from "vite";
import solidPlugin from "vite-plugin-solid";
import { VitePWA } from "vite-plugin-pwa";

const env = loadEnv("production", process.cwd());
export default defineConfig({
  server: {
    port: 45179,
    proxy: {
      "/api": {
        target: "http://localhost:8221/",
        changeOrigin: true
      }
    }
  },
  build: {
    target: "esnext",
    outDir: "./llm/dist"
  },
  base: process.argv.includes("build") ? "./" : env.VITE_DEVURL,
  plugins: [
    solidPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["assets/favicon.ico"],
      manifest: {
        name: "LLM",
        short_name: "LLM",
        description: "LLM",
        theme_color: "#ffffff",
        icons: [
          {
            src: "assets/192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "assets/512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
