import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const branch =
  process.env.LAB_BUILD_BRANCH ?? process.env.GITHUB_HEAD_REF ?? process.env.GITHUB_REF_NAME ?? "local";
const commit = process.env.LAB_BUILD_COMMIT ?? process.env.GITHUB_SHA ?? "local";
const buildTime = process.env.LAB_BUILD_TIME ?? new Date().toISOString();

export default defineConfig({
  define: {
    __LAB_BRANCH__: JSON.stringify(branch),
    __LAB_COMMIT__: JSON.stringify(commit),
    __LAB_BUILD_TIME__: JSON.stringify(buildTime),
  },
  build: {
    outDir: "dist-lab",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        lab: fileURLToPath(new URL("./lab/index.html", import.meta.url)),
      },
    },
  },
});
