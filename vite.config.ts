import { defineConfig, type Plugin } from "vite";

import { projects } from "./src/data/projects.ts";

import { clientLogos } from "./src/data/clients.ts";

import {
  awfulCasesDemo,
  awfulCasesIntro,
  awfulCasesSettingsMockup,
} from "./src/data/content/awful-cases.ts";

import { berryIntro, berryStoryMockups } from "./src/data/content/berry.ts";

import {
  jesteiBrandIntro,
  jesteiEditorialIntro,
  jesteiEventIntro,
  jesteiFeaturedMedia,
  jesteiHomeIntro,
  jesteiHomeMockup,
  jesteiInterfaceIntro,
  jesteiIntro,
  jesteiLandingsIntro,
  jesteiLandingsMockup,
  jesteiPromoIntro,
  jesteiRedpolitikaMockup,
  jesteiStoryMedia,
} from "./src/data/content/jestei-pool.ts";

import { liNeAgencyIntro } from "./src/data/content/li-ne-agency.ts";

import { madCowFilmsIntro } from "./src/data/content/mad-cow-films.ts";

import { moskovskieNovostiIntro } from "./src/data/content/moskovskie-novosti.ts";

import {
  movesAwfulAnimationsIntro,
  movesAwfulIntro,
  movesAwfulLandingMedia,
} from "./src/data/content/moves-awful.ts";

import { progressTraditionIntro } from "./src/data/content/progress-tradition.ts";

import { sandsIntro } from "./src/data/content/sands.ts";

import {
  sensetiqueIntro,
  sensetiqueProductionIntro,
  sensetiqueStudioIntro,
} from "./src/data/content/sensetique.ts";

import {
  shootingsEsmiBanner,
  shootingsEsmiIntro,
  shootingsEvashaBanner,
  shootingsEvashaIntro,
  shootingsHypressionBanner,
  shootingsHypressionIntro,
  shootingsIgguanaIntro,
  shootingsIntro,
  shootingsObladaetIntro,
  shootingsOfeliaIntro,
} from "./src/data/content/shootings.ts";

import {
  styxBrandIntro,
  styxCatalogMockup,
  styxIntro,
  styxLogoBanner,
  styxLookbookIntro,
  styxProductionIntro,
  styxScanographyIntro,
  styxShootingsIntro,
} from "./src/data/content/styx.ts";

import { getMediaAsset, getMediaEntry } from "./src/data/media/index.ts";

import { renderClientLogo } from "./src/templates/client-logo.ts";

import { renderMediaFigure } from "./src/templates/media-figure.ts";

import { renderMockup } from "./src/templates/mockup.ts";

import { renderProjectCard } from "./src/templates/project-card.ts";

import { renderProjectIntro } from "./src/templates/project-intro.ts";

import { renderSectionIntro } from "./src/templates/section-intro.ts";

type HtmlSlot = readonly [marker: string, content: string];

function replaceRequiredSlot(html: string, slot: string, content: string): string {
  if (!html.includes(slot)) {
    throw new Error(`Required HTML slot not found: ${slot}`);
  }

  return html.replace(slot, content);
}

function replaceRequiredSlots(html: string, slots: readonly HtmlSlot[]): string {
  return slots.reduce(
    (output, [slot, content]) => replaceRequiredSlot(output, slot, content),
    html,
  );
}

function replaceFigureContainingMedia(
  html: string,
  entryId: Parameters<typeof getMediaEntry>[0],
  content: string,
): string {
  const entry = getMediaEntry(entryId);
  const asset = getMediaAsset(entry.assetId);
  const mediaIndex = html.indexOf(asset.src);

  if (mediaIndex < 0) {
    throw new Error(`Required legacy media source not found: ${asset.src}`);
  }

  if (html.indexOf(asset.src, mediaIndex + asset.src.length) >= 0) {
    throw new Error(`Legacy media source is ambiguous: ${asset.src}`);
  }

  const figureStart = html.lastIndexOf("<figure", mediaIndex);
  const figureClose = html.indexOf("</figure>", mediaIndex);

  if (figureStart < 0 || figureClose < 0) {
    throw new Error(`Could not resolve legacy figure for media source: ${asset.src}`);
  }

  const figureEnd = figureClose + "</figure>".length;
  return `${html.slice(0, figureStart)}${content}${html.slice(figureEnd)}`;
}

function siteTemplatesPlugin(): Plugin {
  return {
    name: "site-templates",

    transformIndexHtml(html) {
      const projectCards = projects.map(renderProjectCard).join("\n");

      const logos = clientLogos.map(renderClientLogo).join("\n");

      const slots: readonly HtmlSlot[] = [
        ["<!-- PROJECT_CARDS -->", projectCards],
        ["<!-- CLIENT_LOGOS -->", logos],

        // Jestei Pool
        ["<!-- JESTEI_INTRO -->", renderProjectIntro(jesteiIntro)],
        ["<!-- JESTEI_FEATURED_MEDIA -->", renderMediaFigure(jesteiFeaturedMedia)],
        ["<!-- JESTEI_HOME_INTRO -->", renderSectionIntro(jesteiHomeIntro)],
        ["<!-- JESTEI_HOME_MOCKUP -->", renderMockup(jesteiHomeMockup)],
        ["<!-- JESTEI_BRAND_INTRO -->", renderSectionIntro(jesteiBrandIntro)],
        ["<!-- JESTEI_INTERFACE_INTRO -->", renderSectionIntro(jesteiInterfaceIntro)],
        ["<!-- JESTEI_EDITORIAL_INTRO -->", renderSectionIntro(jesteiEditorialIntro)],
        ["<!-- JESTEI_REDPOLITIKA_MOCKUP -->", renderMockup(jesteiRedpolitikaMockup)],
        ["<!-- JESTEI_EVENT_INTRO -->", renderSectionIntro(jesteiEventIntro)],
        ["<!-- JESTEI_LANDINGS_INTRO -->", renderSectionIntro(jesteiLandingsIntro)],
        ["<!-- JESTEI_LANDINGS_MOCKUP -->", renderMockup(jesteiLandingsMockup)],
        ["<!-- JESTEI_PROMO_INTRO -->", renderSectionIntro(jesteiPromoIntro)],

        // Styx
        ["<!-- STYX_INTRO -->", renderProjectIntro(styxIntro)],
        ["<!-- STYX_BRAND_INTRO -->", renderSectionIntro(styxBrandIntro)],
        ["<!-- STYX_LOGO_BANNER -->", renderMediaFigure(styxLogoBanner)],
        ["<!-- STYX_PRODUCTION_INTRO -->", renderSectionIntro(styxProductionIntro)],
        ["<!-- STYX_SCANOGRAPHY_INTRO -->", renderSectionIntro(styxScanographyIntro)],
        ["<!-- STYX_CATALOG_MOCKUP -->", renderMockup(styxCatalogMockup)],
        ["<!-- STYX_SHOOTINGS_INTRO -->", renderSectionIntro(styxShootingsIntro)],
        ["<!-- STYX_LOOKBOOK_INTRO -->", renderSectionIntro(styxLookbookIntro)],

        // Sensetique
        ["<!-- SENSETIQUE_INTRO -->", renderProjectIntro(sensetiqueIntro)],
        ["<!-- SENSETIQUE_STUDIO_INTRO -->", renderSectionIntro(sensetiqueStudioIntro)],
        ["<!-- SENSETIQUE_PRODUCTION_INTRO -->", renderSectionIntro(sensetiqueProductionIntro)],

        // Shootings
        ["<!-- SHOOTINGS_INTRO -->", renderProjectIntro(shootingsIntro)],
        ["<!-- SHOOTINGS_OBLADAET_INTRO -->", renderSectionIntro(shootingsObladaetIntro)],
        ["<!-- SHOOTINGS_EVASHA_INTRO -->", renderSectionIntro(shootingsEvashaIntro)],
        ["<!-- SHOOTINGS_EVASHA_BANNER -->", renderMediaFigure(shootingsEvashaBanner)],
        ["<!-- SHOOTINGS_IGGUANA_INTRO -->", renderSectionIntro(shootingsIgguanaIntro)],
        ["<!-- SHOOTINGS_ESMI_INTRO -->", renderSectionIntro(shootingsEsmiIntro)],
        ["<!-- SHOOTINGS_ESMI_BANNER -->", renderMediaFigure(shootingsEsmiBanner)],
        ["<!-- SHOOTINGS_HYPRESSION_INTRO -->", renderSectionIntro(shootingsHypressionIntro)],
        ["<!-- SHOOTINGS_HYPRESSION_BANNER -->", renderMediaFigure(shootingsHypressionBanner)],
        ["<!-- SHOOTINGS_OFELIA_INTRO -->", renderSectionIntro(shootingsOfeliaIntro)],

        // Berry
        ["<!-- BERRY_INTRO -->", renderProjectIntro(berryIntro)],
        ["<!-- BERRY_STORY_01 -->", renderMockup(berryStoryMockups[0])],
        ["<!-- BERRY_STORY_02 -->", renderMockup(berryStoryMockups[1])],
        ["<!-- BERRY_STORY_03 -->", renderMockup(berryStoryMockups[2])],
        ["<!-- BERRY_STORY_04 -->", renderMockup(berryStoryMockups[3])],

        // S&S
        ["<!-- SANDS_INTRO -->", renderProjectIntro(sandsIntro)],

        // Awful Cases
        ["<!-- AWFUL_CASES_INTRO -->", renderProjectIntro(awfulCasesIntro)],
        ["<!-- AWFUL_CASES_DEMO -->", renderMediaFigure(awfulCasesDemo)],
        ["<!-- AWFUL_CASES_SETTINGS_MOCKUP -->", renderMockup(awfulCasesSettingsMockup)],

        // Moves Awful
        ["<!-- MOVES_AWFUL_INTRO -->", renderProjectIntro(movesAwfulIntro)],
        ["<!-- MOVES_AWFUL_ANIMATIONS_INTRO -->", renderSectionIntro(movesAwfulAnimationsIntro)],
        ["<!-- MOVES_AWFUL_MEDIA_01 -->", renderMediaFigure(movesAwfulLandingMedia[0])],
        ["<!-- MOVES_AWFUL_MEDIA_02 -->", renderMediaFigure(movesAwfulLandingMedia[1])],
        ["<!-- MOVES_AWFUL_MEDIA_03 -->", renderMediaFigure(movesAwfulLandingMedia[2])],

        // Professional experience
        ["<!-- MAD_COW_FILMS_INTRO -->", renderProjectIntro(madCowFilmsIntro)],
        ["<!-- LI_NE_AGENCY_INTRO -->", renderProjectIntro(liNeAgencyIntro)],
        ["<!-- PROGRESS_TRADITION_INTRO -->", renderProjectIntro(progressTraditionIntro)],
        ["<!-- MOSCOW_NEWS_INTRO -->", renderProjectIntro(moskovskieNovostiIntro)],
      ];

      let output = replaceRequiredSlots(html, slots);

      for (const media of jesteiStoryMedia) {
        output = replaceFigureContainingMedia(output, media.entryId, renderMediaFigure(media));
      }

      return output;
    },
  };
}

export default defineConfig({
  plugins: [siteTemplatesPlugin()],
});
