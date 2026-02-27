import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import copy from "rollup-plugin-copy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: "./",
  publicDir: "public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets_folder": path.resolve(__dirname, "src/assets_folder")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    target: "esnext",
    rollupOptions: {
      plugins: [
        copy({
          targets: [
            { src: "src/assets_folder", dest: "dist" }
          ],
          hook: "writeBundle"
        })
      ]
    }
  }
});
