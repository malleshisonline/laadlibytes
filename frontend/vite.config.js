// File location: frontend/vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Sends /api requests to the backend during development, so the refresh and cart cookies stay
      // same-origin. The target comes from VITE_DEV_PROXY_TARGET in .env.development.
      proxy: {
        "/api": {
          target: env.VITE_DEV_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});