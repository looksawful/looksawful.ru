import homepageHtml from "../../../index.html?raw";
import { renderHomepagePage } from "../../site/renderers/home/home-page.ts";
import { extractPageBody } from "../storybook-support/page-document.js";

const meta = {
  title: "05 Pages/Home Page",
  tags: ["autodocs", "stable"],
  render: () => extractPageBody(renderHomepagePage(homepageHtml)),
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/site/renderers/home/home-page.ts",
        "src/site/renderers/home/home-slots.ts",
        "src/site/pages/manifest.ts",
        "src/site/pages/homepage.ts",
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
        component: "Canonical homepage archetype produced by the real index.html fixture and production homepage transformation pipeline.",
      },
    },
  },
};

export default meta;
export const ProductionRoute = {};
