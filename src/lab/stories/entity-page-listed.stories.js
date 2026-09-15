import { getPageByPath } from "../../site/pages/manifest.ts";
import { renderStandaloneEntityPage } from "../../site/renderers/entity-page.ts";
import { extractPageBody } from "../storybook-support/page-document.js";

const page = getPageByPath("/work/jestei-pool/");
if (!page || page.type !== "case") throw new Error("Listed entity route is unavailable");

const meta = {
  title: "05 Pages/Entity Page/Listed",
  tags: ["autodocs", "stable"],
  render: () => extractPageBody(renderStandaloneEntityPage(page)),
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/site/renderers/entity-page.ts",
        "src/site/renderers/entity/entity-shell.ts",
        "src/site/renderers/entity/content-block.ts",
        "src/site/renderers/entity/section.ts",
        "src/site/shell/page-shell.ts",
        "src/site/pages/manifest.ts",
        "src/site/pages/entity-presentation.ts",
      ],
      layer: "page",
      policy: "page",
      canonical: true,      state: "listed-route-ready",
      visibility: ["always"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
      routeDiscovery: { listed: true, indexable: true },
    },
    docs: {
      description: {
        component: "Canonical listed entity archetype using the production Jestei route, entity renderer, nested entity composition renderers and page shell.",
      },
    },
  },
};

export default meta;
export const JesteiPool = {};
