import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

import { createSiteInputs } from "./src/site/build/inputs.ts";
import { createPublicStaticBuildPlugin } from "./src/site/build/public-static-build-plugin.ts";
import { createSitePagesPlugin } from "./src/site/build/site-pages-plugin.ts";
import { createMediaDeskAuthPlugin } from "./src/devtools/media-desk/auth.ts";
import { createMediaDeskWritePlugin } from "./src/devtools/media-desk/server.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const contentDeskWrite = process.env.CONTENT_DESK_WRITE === "1";
const mediaDeskAuth = process.env.MEDIA_DESK_AUTH === "1";
const mediaDeskPublicOrigin = process.env.MEDIA_DESK_PUBLIC_ORIGIN?.trim();
const mediaDeskAllowedHosts = mediaDeskAuth && mediaDeskPublicOrigin
  ? [new URL(mediaDeskPublicOrigin).hostname]
  : undefined;

export default defineConfig({
  css: {
    lightningcss: {
      drafts: {
        scrollNavigationControls: true,
      },
    },
  },

  server: mediaDeskAuth
    ? {
        hmr: false,
        allowedHosts: mediaDeskAllowedHosts,
      }
    : undefined,

  plugins: [
    ...(mediaDeskAuth ? [createMediaDeskAuthPlugin()] : []),
    createSitePagesPlugin(root),
    createPublicStaticBuildPlugin(root),
    ...(contentDeskWrite ? [createMediaDeskWritePlugin(root)] : []),
  ],

  build: {
    license: {
      fileName: "THIRD_PARTY_LICENSES.md",
    },
    rollupOptions: {
      input: createSiteInputs(root),
    },
  },
});
