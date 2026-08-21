import { defineConfig, type Plugin } from "vite";

import { projects } from "./src/data/projects.ts";
import { clientLogos } from "./src/data/clients.ts";

import { renderProjectCard } from "./src/templates/project-card.ts";
import { renderClientLogo } from "./src/templates/client-logo.ts";

const PROJECT_CARDS_SLOT = "<!-- PROJECT_CARDS -->";

const CLIENT_LOGOS_SLOT = "<!-- CLIENT_LOGOS -->";

function replaceRequiredSlot(html: string, slot: string, content: string): string {
  if (!html.includes(slot)) {
    throw new Error(`Required HTML slot not found: ${slot}`);
  }

  return html.replace(slot, content);
}

function siteTemplatesPlugin(): Plugin {
  return {
    name: "site-templates",

    transformIndexHtml(html) {
      const projectCards = projects.map(renderProjectCard).join("\n");

      const logos = clientLogos.map(renderClientLogo).join("\n");

      let output = html;

      output = replaceRequiredSlot(output, PROJECT_CARDS_SLOT, projectCards);

      output = replaceRequiredSlot(output, CLIENT_LOGOS_SLOT, logos);

      return output;
    },
  };
}

export default defineConfig({
  plugins: [siteTemplatesPlugin()],
});
