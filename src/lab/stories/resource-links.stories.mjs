import { renderResourceLinks } from "../../components/composition/resource-links.ts";
import { jesteiEditorialResources } from "../../data/content/jestei-page-presentation.ts";
import { sensetiqueEquipmentResources } from "../../data/content/sensetique-page-presentation.ts";

const meta = {
  title: "02 Molecules/Resource Links",
  tags: ["autodocs"],
  render: () => renderResourceLinks(jesteiEditorialResources, { reveal: false }),
  parameters: {
    layout: "padded",
    docs: { description: { component: "Uses canonical resource-row rendering with real Jestei editorial and Sensetique equipment resource data; reveal orchestration is disabled for isolation." } },
  },
};

export default meta;
export const EditorialGuide = {};
export const EquipmentPdf = { render: () => renderResourceLinks(sensetiqueEquipmentResources, { reveal: false }) };
