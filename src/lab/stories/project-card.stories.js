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
      interaction: ["default", "focus-visible"],
      responsive: {
        review: ["desktop", "tablet", "mobile"],
      },
    },
    docs: {
      description: {
        component: "Uses a visibility-filtered canonical ProjectCardPresentation and the production project-card renderer, including canonical route resolution, keyboard focus styling and responsive media data.",
      },
    },
  },
};

export default meta;

export const Default = {};

export const FocusVisible = {
  play: ({ canvasElement }) => {
    const link = canvasElement.querySelector(".project-card");
    if (link instanceof HTMLAnchorElement) link.focus();
  },
  parameters: {
    looksawful: {
      state: "focus-visible",
      interaction: ["focus-visible"],
    },
  },
};
