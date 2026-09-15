import { movesAwfulAnimationsIntro } from "../../data/content/moves-awful.ts";
import { renderSectionIntro } from "../../templates/section-intro.ts";

const meta = {
  title: "02 Molecules/Section Intro",
  tags: ["autodocs", "stable", "project:moves-awful"],
  render: () => renderSectionIntro(movesAwfulAnimationsIntro, { reveal: false }),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/data/content/moves-awful.ts",
        "src/templates/section-intro.ts",
        "src/site/renderers/home/home-slots.ts",
      ],
      layer: "molecule",
      policy: "composition",
      canonical: true,
      state: "embedded-no-reveal",
      visibility: ["always"],
      motion: ["settled"],
      responsive: {
        review: ["desktop", "tablet", "mobile"],
      },
    },
    docs: {
      description: {
        component: "Uses the canonical Moves Awful section data and the production section-intro renderer in the same reveal-disabled mode used by the nested homepage composition.",
      },
    },
  },
};

export default meta;

export const EmbeddedNoReveal = {};
