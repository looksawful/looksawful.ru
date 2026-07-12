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

const injectBeforeHeadEnd = (html, content) =>
  html.includes("</head>") ? html.replace("</head>", `${content}\n</head>`) : `${content}\n${html}`;

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

      const normalizedPath = pagePath.replace(/\\/g, "/");
      const isAwfulCases = normalizedPath.includes("/pets/awful-cases/");
      const isAwfulAudit = normalizedPath.includes("/pets/awful-audit/");

      let output = html;
      output = removeElementByClass(output, "a", "mobile-back-button");
      output = removeElementByClass(output, "nav", "pet-shell-nav");
      output = removeElementByClass(output, "footer", "pet-shell-footer");
      output = removeElementByClass(output, "footer", "fkeys");

      if (isAwfulCases) {
        output = removeElementByClass(output, "div", "command-row");
      }

      const cleanupRules = [
        ".mobile-back-button,.pet-shell-nav,.pet-shell-footer,.fkeys{display:none!important}",
        isAwfulCases ? '.command-row[aria-label="Project links"]{display:none!important}' : "",
        isAwfulAudit ? ".page{padding-bottom:var(--page-pad)!important}" : "",
      ]
        .filter(Boolean)
        .join("");

      output = injectBeforeHeadEnd(output, `<style data-pet-page-cleanup>${cleanupRules}</style>`);

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

const injectPetPreviewCleanup = {
  name: "inject-pet-preview-cleanup",
  transformIndexHtml: {
    order: "post",
    handler(html, context) {
      const pagePath = (context?.filename || context?.path || "").replace(/\\/g, "/");
      const isNestedPage = /\/(?:pets|resume|gallery)\//i.test(pagePath);
      const isRootIndex = context?.path === "/" || (pagePath.endsWith("/index.html") && !isNestedPage);

      if (!isRootIndex) {
        return html;
      }

      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              type: "module",
              src: "/src/pet-project-preview-cleanup.js",
            },
            injectTo: "body",
          },
        ],
      };
    },
  },
};

export default defineConfig({
  plugins: [cleanPetProjectPages, injectPetPreviewCleanup],
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
