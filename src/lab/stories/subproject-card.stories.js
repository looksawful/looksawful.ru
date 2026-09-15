import { petProjectCards } from "../../data/subproject-cards.ts";
import { renderSubprojectCard } from "../../templates/subproject-card.ts";

const meta = {
  title: "02 Molecules/Subproject Card",
  tags: ["autodocs", "stable"],
  render: () => renderSubprojectCard(petProjectCards[0]),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: ["src/data/subproject-cards.ts", "src/templates/subproject-card.ts"],
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
          "Uses the canonical pet-project card dataset and production subproject-card renderer. Link, media, title and description markup are not reproduced in Storybook.",
      },
    },
  },
};
export default meta;
export const Default = {};
