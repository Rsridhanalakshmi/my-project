import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://gconnect-dev.gdinexus.com:8409",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});