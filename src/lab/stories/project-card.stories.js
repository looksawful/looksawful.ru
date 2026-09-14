import { getVisibleProjectCardPresentations } from "../../data/projects.ts";
import { renderProjectCard } from "../../templates/project-card.ts";

const card = getVisibleProjectCardPresentations()[0];

const meta = {
  title: "02 Molecules/Project Card",
  tags: ["autodocs", "stable"],
  render: () => renderProjectCard(card),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/data/projects.ts",
        "src/templates/project-card.ts",
        "src/site/pages/project-card-routes.ts",
      ],
      layer: "molecule",
      policy: "isolated",
      canonical: true,
      state: "default",
      visibility: ["always"],
      responsive: {
        review: ["desktop", "tablet", "mobile"],
      },
    },
    docs: {
      description: {
        component: "Uses a visibility-filtered canonical ProjectCardPresentation and the production project-card renderer, including canonical route resolution and responsive media data.",
      },
    },
  },
};

export default meta;

export const Default = {};
