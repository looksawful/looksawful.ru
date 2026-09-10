import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vite";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");

export default defineConfig({
  root,
  publicDir: false,
  build: {
    outDir: path.resolve(root, ".cache/media-desk-cloudflare/dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        "tools/media-desk/index": path.resolve(root, "tools/media-desk/index.html"),
      },
    },
  },
});
