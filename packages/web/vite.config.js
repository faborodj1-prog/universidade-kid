import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/trails/,
            handler: "NetworkFirst",
            options: { cacheName: "api-trails", expiration: { maxAgeSeconds: 3600 } },
          },
        ],
      },
      manifest: {
        name: "Universidade Kid",
        short_name: "Kid Univ",
        description: "Plataforma de treinamento e certificação",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#DC2626",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
