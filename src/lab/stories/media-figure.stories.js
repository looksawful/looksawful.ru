import { awfulCasesDemo } from "../../data/content/awful-cases.ts";
import { renderMediaFigure } from "../../templates/media-figure.ts";

const meta = {
  title: "02 Molecules/Media Figure",
  tags: ["autodocs", "stable", "project:awful-cases"],
  render: () => renderMediaFigure(awfulCasesDemo),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/data/content/awful-cases.ts",
        "src/templates/media-figure.ts",
        "src/site/renderers/home/home-slots.ts",
      ],
      layer: "molecule",
      policy: "isolated",
      canonical: true,
      state: "default",
      visibility: ["always"],
      data: ["ready"],
      motion: ["autoplay"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: {
      description: {
        component:
          "Uses the canonical Awful Cases demo data and production media-figure renderer, preserving its real autoplay, caption and responsive media behavior.",
      },
    },
  },
};

export default meta;
export const Default = {};
