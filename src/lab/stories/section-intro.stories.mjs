import { movesAwfulAnimationsIntro } from "../../data/content/moves-awful.ts";
import { renderSectionIntro } from "../../templates/section-intro.ts";

const meta = {
  title: "02 Molecules/Section Intro",
  tags: ["autodocs"],
  render: () => renderSectionIntro(movesAwfulAnimationsIntro, { reveal: false }),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Uses the canonical Moves Awful section data and the production section-intro renderer in the same reveal-disabled mode used by the nested homepage composition.",
      },
    },
  },
};

export default meta;

export const EmbeddedNoReveal = {};
