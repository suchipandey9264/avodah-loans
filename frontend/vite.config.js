import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward /api calls to the backend during development (see ../backend).
    proxy: { "/api": "http://localhost:4000" },
  },
});
