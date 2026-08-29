import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

import { createSiteInputs } from "./src/site/build/inputs.ts";
import { createSitePagesPlugin } from "./src/site/build/site-pages-plugin.ts";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  css: {
    lightningcss: {
      drafts: {
        scrollNavigationControls: true,
      },
    },
  },

  plugins: [createSitePagesPlugin(root)],

  build: {
    rollupOptions: {
      input: createSiteInputs(root),
    },
  },
});
