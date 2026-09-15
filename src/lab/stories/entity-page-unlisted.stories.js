import { getPageByPath } from "../../site/pages/manifest.ts";
import { renderStandaloneEntityPage } from "../../site/renderers/entity-page.ts";
import { extractPageBody } from "../storybook-support/page-document.js";

const page = getPageByPath("/work/awful-cases/");
if (!page || page.type !== "project") throw new Error("Unlisted entity route is unavailable");

const meta = {
  title: "05 Pages/Entity Page/Unlisted",
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
      canonical: true,      state: "unlisted-route-ready",
      visibility: ["always"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
      routeDiscovery: { listed: false, indexable: false },
    },
    docs: {
      description: {
        component: "Canonical unlisted entity archetype using the production Awful Cases route. Route discovery is recorded separately from visual visibility.",
      },
    },
  },
};

export default meta;
export const AwfulCases = {};
