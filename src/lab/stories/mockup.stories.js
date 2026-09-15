import { berryStoryMockups } from "../../data/content/berry.ts";
import { renderMockup } from "../../templates/mockup.ts";

const meta = {
  title: "02 Molecules/Mockup",
  tags: ["autodocs", "stable", "project:berry"],
  render: () => renderMockup(berryStoryMockups[0]),
  parameters: {
    layout: "centered",
    looksawful: {
      sources: [
        "src/data/content/berry.ts",
        "src/templates/mockup.ts",
        "src/site/renderers/home/home-slots.ts",
      ],
      layer: "molecule",
      policy: "isolated",
      canonical: true,
      state: "default",
      visibility: ["always"],
      data: ["ready"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: {
      description: {
        component:
          "Uses a real Berry homepage mockup fixture and the production mockup renderer; device shell, media and caption markup remain production-owned.",
      },
    },
  },
};
export default meta;
export const Default = {};
