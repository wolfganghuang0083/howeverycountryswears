import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  // Vercel sets VERCEL_ENV=production|preview|development at build time.
  // import.meta.env.PROD is true for BOTH Preview and Production builds, so we
  // need this to let Preview show future-dated / draft posts.
  define: {
    "import.meta.env.VITE_HECS_VERCEL_ENV": JSON.stringify(
      process.env.VERCEL_ENV || process.env.VITE_HECS_VERCEL_ENV || "",
    ),
  },
  plugins: [react(), tailwindcss()],
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
