import { defineConfig } from "vite";

export default defineConfig({
  base: "./",              // важно для Electron/Capacitor
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    target: "esnext"       // чтобы поддерживался top-level await
  }
});
