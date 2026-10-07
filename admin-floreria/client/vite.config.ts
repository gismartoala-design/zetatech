import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@site': path.resolve(__dirname, '../../shared'),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    fs: { allow: [path.resolve(__dirname, '../..')] },
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        // La API del admin corre en 4001 (ver api/.env.example). Se puede
        // apuntar a otro host con API_PROXY_TARGET.
        target: process.env.API_PROXY_TARGET || "http://localhost:4001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
