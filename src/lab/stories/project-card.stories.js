import { projectCardPresentations } from "../../data/projects.ts";
import { renderProjectCard } from "../../templates/project-card.ts";

const meta = {
  title: "02 Molecules/Project Card",
  tags: ["autodocs", "stable"],
  render: () => {
    const list = document.createElement("ul");
    list.className = "projects-grid";
    list.innerHTML = renderProjectCard(projectCardPresentations[0]);
    return list;
  },
  parameters: {
    layout: "padded",
    looksawful: {
      sources: ["src/templates/project-card.ts", "src/data/projects.ts"],
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
