import { renderResourceLinks } from "../../components/composition/resource-links.ts";
import { jesteiEditorialResources } from "../../data/content/jestei-page-presentation.ts";
import { sensetiqueEquipmentResources } from "../../data/content/sensetique-page-presentation.ts";

const meta = {
  title: "02 Molecules/Resource Links",
  tags: ["autodocs", "stable"],
  render: () => renderResourceLinks(jesteiEditorialResources, { reveal: false }),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/components/composition/resource-links.ts",
        "src/data/content/jestei-page-presentation.ts",
        "src/data/content/sensetique-page-presentation.ts",
      ],
      layer: "molecule",
      policy: "isolated",
      canonical: true,
      state: "production-resource-sets",
      visibility: ["always"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: { description: { component: "Uses canonical resource-row rendering with real Jestei editorial and Sensetique equipment resource data; reveal orchestration is disabled for isolation." } },
  },
};

export default meta;
export const EditorialGuide = {};
export const EquipmentPdf = { render: () => renderResourceLinks(sensetiqueEquipmentResources, { reveal: false }) };
