import { getPageByPath } from "../../site/pages/manifest.ts";
import { renderGalleryPage } from "../../site/renderers/gallery-page.ts";
import { extractPageBody } from "../storybook-support/page-document.js";

const page = getPageByPath("/gallery/");
if (!page || page.type !== "gallery") throw new Error("Gallery route is unavailable");

const meta = {
  title: "05 Pages/Gallery Page",
  tags: ["autodocs", "stable"],
  render: () => extractPageBody(renderGalleryPage(page)),
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/site/renderers/gallery-page.ts",
        "src/site/shell/page-shell.ts",
        "src/site/pages/manifest.ts",
      ],
      layer: "page",
      policy: "page",
      canonical: true,
      state: "route-ready",
      visibility: ["always"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
      routeDiscovery: { listed: true, indexable: true },
    },    docs: {
      description: {
        component: "Canonical listed gallery route rendered through the production page renderer and page shell. Runtime scripts are intentionally omitted from the page-composition canvas.",
      },
    },
  },
};

export default meta;
export const ListedRoute = {};
