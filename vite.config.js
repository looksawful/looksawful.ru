import { defineConfig } from "vite";
import { resolve } from "node:path";

const PET_PAGE_PATH = /(?:^|[\\/])pets[\\/](?:berserk-timer|awful-cases|awful-audit)(?:[\\/]|$)/i;
const CYRILLIC_TEXT = /[А-Яа-яЁё]+/g;

const removeElementByClass = (html, tagName, className) =>
  html.replace(
    new RegExp(
      `<${tagName}\\b[^>]*class=(['"])[^'"]*\\b${className}\\b[^'"]*\\1[^>]*>[\\s\\S]*?<\\/${tagName}>`,
      "gi",
    ),
    "",
  );

const cleanPetProjectPages = {
  name: "clean-pet-project-pages",
  enforce: "pre",
  transformIndexHtml: {
    order: "pre",
    handler(html, context) {
      const pagePath = context?.filename || context?.path || "";
      if (!PET_PAGE_PATH.test(pagePath)) {
        return html;
      }

      let output = html;
      output = removeElementByClass(output, "a", "mobile-back-button");
      output = removeElementByClass(output, "nav", "pet-shell-nav");
      output = removeElementByClass(output, "footer", "pet-shell-footer");

      const cyrillic = [...new Set(output.match(CYRILLIC_TEXT) || [])];
      if (cyrillic.length) {
        throw new Error(
          `Pet project page ${pagePath} still contains Cyrillic text: ${cyrillic.join(", ")}`,
        );
      }

      return output;
    },
  },
};

export default defineConfig({
  plugins: [cleanPetProjectPages],
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
