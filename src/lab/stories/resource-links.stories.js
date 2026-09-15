import { renderResourceLinks } from "../../components/composition/resource-links.ts";
import { jesteiEditorialResources } from "../../data/content/jestei-page-presentation.ts";

const meta = {
  title: "02 Molecules/Resource Links",
  tags: ["autodocs", "stable", "project:jestei-pool"],
  render: () => renderResourceLinks(jesteiEditorialResources),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/components/composition/resource-links.ts",
        "src/data/content/jestei-page-presentation.ts",
        "src/site/renderers/entity/section.ts",
      ],
      layer: "molecule",
      policy: "isolated",
      canonical: true,
      state: "default",
      visibility: ["always"],
      motion: ["auto"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: {
      description: {
        component:
          "Uses the canonical Jestei editorial resources and the production resource-links renderer in the reveal-disabled embedded mode used by entity sections.",
      },
    },
  },
};
export default meta;
export const Default = {};
