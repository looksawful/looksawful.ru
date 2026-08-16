import { defineConfig } from "vite";
import { createSensetiqueIndexPlugin } from "./tools/sensetique-index-plugin.mjs";

export default defineConfig({
  plugins: [createSensetiqueIndexPlugin()],
});
