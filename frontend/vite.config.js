// File location: frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Sends /api requests to the Express backend during development,
    // so the login refresh cookie works on the same origin.
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});