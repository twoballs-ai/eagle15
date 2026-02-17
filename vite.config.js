import { defineConfig } from "vite";
import path from "path";
import copy from "rollup-plugin-copy";

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
            { src: "src/assets_folder", dest: "dist" } // копируем как есть
          ],
          hook: "writeBundle"
        })
      ]
    }
  }
});
