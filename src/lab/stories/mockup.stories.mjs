import { renderMockup } from "../../components/content/mockup.ts";
import { awfulCasesSettingsMockup } from "../../data/content/awful-cases.ts";
import { berryStoryMockups } from "../../data/content/berry.ts";

const meta = {
  title: "02 Molecules/Mockup",
  tags: ["autodocs", "stable"],
  render: () => renderMockup(awfulCasesSettingsMockup),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/templates/mockup.ts",
        "src/components/content/mockup.ts",
        "src/data/content/awful-cases.ts",
        "src/data/content/berry.ts",
      ],
      layer: "molecule",
      policy: "isolated",
      canonical: true,
      state: "device-variants",
      visibility: ["always"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: { description: { component: "Uses canonical Mockup rendering with production desktop and mobile dark-theme fixtures." } },
  },
};

export default meta;
export const DesktopDark = {};
export const MobileDark = { render: () => renderMockup(berryStoryMockups[0]) };
