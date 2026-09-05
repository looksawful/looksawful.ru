import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

import { createSiteInputs } from "./src/site/build/inputs.ts";
import { createPublicStaticBuildPlugin } from "./src/site/build/public-static-build-plugin.ts";
import { createSitePagesPlugin } from "./src/site/build/site-pages-plugin.ts";
import { createMediaDeskWritePlugin } from "./src/devtools/media-desk/server.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const contentDeskWrite = process.env.CONTENT_DESK_WRITE === "1";

export default defineConfig({
  css: {
    lightningcss: {
      drafts: {
        scrollNavigationControls: true,
      },
    },
  },

  plugins: [
    createSitePagesPlugin(root),
    createPublicStaticBuildPlugin(root),
    ...(contentDeskWrite ? [createMediaDeskWritePlugin(root)] : []),
  ],

  build: {
    rollupOptions: {
      input: createSiteInputs(root),
    },
  },
});
