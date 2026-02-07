import { defineConfig } from "vite";

export default defineConfig({
  base: "./",              // критично для Electron file://
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    target: "es2020"
  }
});
