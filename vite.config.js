import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "pets/berserk-timer": resolve(__dirname, "pets/berserk-timer/index.html"),
        "pets/awful-cases": resolve(__dirname, "pets/awful-cases/index.html"),
        "pets/awful-audit": resolve(__dirname, "pets/awful-audit/index.html"),
        resume: resolve(__dirname, "resume/index.html"),
        gallery: resolve(__dirname, "gallery/index.html"),
      },
    },
  },
});
