/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "HEIC Converter",
        short_name: "HEIC2JPG",
        description: "Free, private HEIC to JPG/PNG converter",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          },
          {
            src: "icon.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "icon.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  worker: {
    format: "es",
  },
});
