import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/TeleCare+/" : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TeleCare+',
        short_name: 'TeleCare+',
        description: 'Enterprise Healthcare Management Platform',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    sourcemap: mode !== "production",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (
            id.includes("react-router-dom")
            || id.includes("react-dom")
            || id.includes("\\react\\")
            || id.includes("/react/")
          ) {
            return "framework-vendor";
          }
          if (id.includes("lucide-react")) {
            return "icon-vendor";
          }
          if (id.includes("axios")) {
            return "network-vendor";
          }
          if (id.includes("leaflet") || id.includes("react-leaflet")) {
            return "map-vendor";
          }
          if (id.includes("recharts") || id.includes("d3-")) {
            return "chart-vendor";
          }
          if (id.includes("framer-motion")) {
            return "animation-vendor";
          }
          if (id.includes("@radix-ui")) {
            return "ui-vendor";
          }
          return undefined;
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    },
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    }
  }
}));
