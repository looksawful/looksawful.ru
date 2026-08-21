import { defineConfig, type Plugin } from "vite";

import { projects } from "./src/data/projects.ts";
import { renderProjectCard } from "./src/templates/project-card.ts";

const PROJECT_CARDS_SLOT = "<!-- PROJECT_CARDS -->";

function projectCardsPlugin(): Plugin {
  return {
    name: "project-cards",

    transformIndexHtml(html) {
      if (!html.includes(PROJECT_CARDS_SLOT)) {
        throw new Error(`Project cards slot not found: ${PROJECT_CARDS_SLOT}`);
      }

      const projectCards = projects.map(renderProjectCard).join("\n");

      return html.replace(PROJECT_CARDS_SLOT, projectCards);
    },
  };
}

export default defineConfig({
  plugins: [projectCardsPlugin()],
});
