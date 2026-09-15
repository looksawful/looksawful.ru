import { getPageByPath } from "../../site/pages/manifest.ts";
import { renderNotFoundPage } from "../../site/renderers/not-found-page.ts";
import { extractPageBody } from "../storybook-support/page-document.js";

const page = getPageByPath("/404.html");
if (!page || page.type !== "not-found") throw new Error("Not-found route is unavailable");

const meta = {
  title: "05 Pages/Not Found",
  tags: ["autodocs", "stable"],
  render: () => extractPageBody(renderNotFoundPage(page)),
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/site/renderers/not-found-page.ts",
        "src/site/shell/page-shell.ts",
        "src/site/pages/manifest.ts",
      ],
      layer: "page",
      policy: "page",
      canonical: true,
      state: "not-found-route-ready",
      visibility: ["always"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
      routeDiscovery: { listed: false, indexable: false },
    },    docs: {
      description: {
        component: "Canonical 404 route rendered through the production not-found renderer and page shell. It is visually present while remaining unlisted and non-indexable.",
      },
    },
  },
};

export default meta;
export const Route404 = {};
