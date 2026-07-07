import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/TeleCare+/" : "/",
  plugins: [react()],
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
