import { movesAwfulAnimationsIntro } from "../../data/content/moves-awful.ts";
import { renderSectionIntro } from "../../templates/section-intro.ts";

const meta = {
  title: "02 Molecules/Section Intro",
  tags: ["autodocs", "stable", "project:moves-awful"],
  render: () => renderSectionIntro(movesAwfulAnimationsIntro, { reveal: false }),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: ["src/templates/section-intro.ts", "src/data/content/moves-awful.ts"],
      layer: "molecule",
      policy: "isolated",
      canonical: true,
      state: "default",
      visibility: ["always"],
    },
  },
};

export default meta;
export const Default = {};
