import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import path from "path";

export default defineConfig({
  define: {
    "process.env": JSON.stringify({}),
    global: "globalThis",
  },
  plugins: [
    react(),
    webExtension({
      manifest: () => ({
        manifest_version: 3,
        name: "CambioKPI",
        version: "1.0.0",
        description: "Gestión de operaciones P2P para cambistas profesionales",
        permissions: ["storage", "notifications", "alarms"],
        host_permissions: [
          "https://*.supabase.co/*",
          "https://api.coingecko.com/*",
          "https://v6.exchangerate-api.com/*",
        ],
        action: {
          default_popup: "index.html",
          default_icon: {
            "16": "icons/icon-16.png",
            "48": "icons/icon-48.png",
            "128": "icons/icon-128.png",
          },
        },
        background: {
          service_worker: "src/background.ts",
          type: "module",
        },
        icons: {
          "16": "icons/icon-16.png",
          "48": "icons/icon-48.png",
          "128": "icons/icon-128.png",
        },
      }),
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
