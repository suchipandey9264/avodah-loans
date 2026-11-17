import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Always 5173 (the backend's CORS_ORIGIN and redirect point here); fail loudly instead of silently moving ports.
    port: 5173,
    strictPort: true,
    // Forward /api calls to the backend during development (see ../backend).
    proxy: { "/api": "http://localhost:4000" },
  },
});
