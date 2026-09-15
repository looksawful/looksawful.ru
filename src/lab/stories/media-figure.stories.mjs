import { renderMediaFigure } from "../../components/content/media-figure.ts";
import { awfulCasesDemo } from "../../data/content/awful-cases.ts";

const meta = {
  title: "02 Molecules/Media Figure",
  tags: ["autodocs", "stable", "project:awful-cases"],
  render: () => renderMediaFigure(awfulCasesDemo, { reveal: false }),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/templates/media-figure.ts",
        "src/components/content/media-figure.ts",
        "src/data/content/awful-cases.ts",
      ],
      layer: "molecule",
      policy: "isolated",
      canonical: true,
      state: "video-banner",
      visibility: ["always"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: { description: { component: "Uses the canonical Media Figure renderer and the real Awful Cases demo video fixture with page reveal orchestration disabled." } },
  },
};

export default meta;

export const VideoBanner = {};
