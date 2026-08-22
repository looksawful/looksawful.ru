import { defineConfig, type Plugin } from "vite";

import { projects } from "./src/data/projects.ts";
import { clientLogos } from "./src/data/clients.ts";

import {
  jesteiFeaturedMedia,
  jesteiHomeIntro,
  jesteiHomeMockup,
  jesteiIntro,
} from "./src/data/content/jestei-pool.ts";

import { renderClientLogo } from "./src/templates/client-logo.ts";
import { renderMediaFigure } from "./src/templates/media-figure.ts";
import { renderMockup } from "./src/templates/mockup.ts";
import { renderProjectCard } from "./src/templates/project-card.ts";
import { renderProjectIntro } from "./src/templates/project-intro.ts";
import { renderSectionIntro } from "./src/templates/section-intro.ts";

const PROJECT_CARDS_SLOT = "<!-- PROJECT_CARDS -->";

const CLIENT_LOGOS_SLOT = "<!-- CLIENT_LOGOS -->";

const JESTEI_INTRO_SLOT = "<!-- JESTEI_INTRO -->";

const JESTEI_FEATURED_MEDIA_SLOT = "<!-- JESTEI_FEATURED_MEDIA -->";

const JESTEI_HOME_INTRO_SLOT = "<!-- JESTEI_HOME_INTRO -->";

const JESTEI_HOME_MOCKUP_SLOT = "<!-- JESTEI_HOME_MOCKUP -->";

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

      output = replaceRequiredSlot(output, JESTEI_INTRO_SLOT, renderProjectIntro(jesteiIntro));

      output = replaceRequiredSlot(
        output,
        JESTEI_FEATURED_MEDIA_SLOT,
        renderMediaFigure(jesteiFeaturedMedia),
      );

      output = replaceRequiredSlot(
        output,
        JESTEI_HOME_INTRO_SLOT,
        renderSectionIntro(jesteiHomeIntro),
      );

      output = replaceRequiredSlot(output, JESTEI_HOME_MOCKUP_SLOT, renderMockup(jesteiHomeMockup));

      return output;
    },
  };
}

export default defineConfig({
  plugins: [siteTemplatesPlugin()],
});
