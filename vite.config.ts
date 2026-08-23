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
  jesteiBrandSystemGroup,
  jesteiEditorialIntro,
  jesteiEventGroup,
  jesteiEventIntro,
  jesteiFeaturedMedia,
  jesteiHomeIntro,
  jesteiHomeMockup,
  jesteiInstagramPlayerStrip,
  jesteiInterfaceGroup,
  jesteiInterfaceIntro,
  jesteiIntro,
  jesteiLandingsIntro,
  jesteiLandingsMockup,
  jesteiPromoIntro,
  jesteiPromoSequence,
  jesteiRedpolitikaMockup,
  jesteiSubscriptionBeforeAfter,
} from "./src/data/content/jestei-pool.ts";

import { liNeAgencyIntro } from "./src/data/content/li-ne-agency.ts";

import { madCowFilmsIntro } from "./src/data/content/mad-cow-films.ts";

import { moskovskieNovostiIntro } from "./src/data/content/moskovskie-novosti.ts";

import {
  movesAwfulAnimationsIntro,
  movesAwfulCanvasGallery,
  movesAwfulIntro,
  movesAwfulLandingMedia,
} from "./src/data/content/moves-awful.ts";

import { progressTraditionIntro } from "./src/data/content/progress-tradition.ts";

import { sandsFeatureMockupDeck, sandsIntro, sandsLookbookStrip } from "./src/data/content/sands.ts";

import {
  portfolioSensetiqueStrip,
  sensetiqueBuro247Group,
  sensetiqueChapurinBentoGroup,
  sensetiqueDaniilKorotechenkovSequence,
  sensetiqueDigitalFearPageFlip,
  sensetiqueEditorialProductionReel,
  sensetiqueHarshLightSlider,
  sensetiqueHarshLightStrip,
  sensetiqueInnaHonourReel,
  sensetiqueIntro,
  sensetiqueIvanKrushinskyEditorialStrip,
  sensetiqueKatyaKnyazevaEditorialGroup,
  sensetiqueKrasotaDressStrip,
  sensetiqueKrasotaDressVideo,
  sensetiqueOlovoArchitectureStrip,
  sensetiqueOlovoBackstageVideo,
  sensetiqueOlovoBookletGroup,
  sensetiqueOlovoCampaignStrip,
  sensetiqueOlovoLookbook2016Reel,
  sensetiqueOlovoLookbook2018Reel,
  sensetiqueProductionIntro,
  sensetiqueRaputoEditorialStrip,
  sensetiqueStudioInfiniteStrip,
  sensetiqueStudioIntro,
  sensetiqueStudioJustifiedGallery,
  sensetiqueStudioMockupDeck,
  sensetiqueTatianaNikishinaEditorialGroup,
  sensetiqueTatianaNikishinaSupplementalReel,
  sensetiqueWoodMetalPanicStrip,
  sensetiqueYoungPioneerSequence,
  sensetiqueYoungPioneerStrip,
  sensetiqueYuriIvanovEditorialGroup,
} from "./src/data/content/sensetique.ts";

import {
  portfolioShootingsStrip,
  shootingsEsmiBanner,
  shootingsEsmiIntro,
  shootingsEvashaBanner,
  shootingsEvashaCoverReel,
  shootingsEvashaIntro,
  shootingsEvashaMixedGroup,
  shootingsEvashaPairFigure,
  shootingsEvashaPortraitReel,
  shootingsEvashaPortraitsGroup,
  shootingsHypressionBanner,
  shootingsHypressionCollageGroup,
  shootingsHypressionIntro,
  shootingsHypressionMixedMediaGroup,
  shootingsHypressionPortraitsGroup,
  shootingsIgguanaIntro,
  shootingsIgguanaMasonryGroup,
  shootingsIntro,
  shootingsObladaetCollageReel,
  shootingsObladaetIntro,
  shootingsObladaetMixedMediaReel,
  shootingsObladaetPairGroup,
  shootingsObladaetPortraitsGroup,
  shootingsOfeliaIntro,
  shootingsOfeliaStrip,
} from "./src/data/content/shootings.ts";

import {
  portfolioScanographyStrip,
  styxBrandIntro,
  styxBrandLookbookReel,
  styxCatalogMockup,
  styxIntro,
  styxLogoBanner,
  styxLookbook2025Reel,
  styxLookbookIntro,
  styxLookbookMasonryGroup,
  styxGiftCertificateSlider,
  styxPrintLinksGroup,
  styxProductionIntro,
  styxProductionMediaGroup,
  styxProductionMockupDeck,
  styxScanographyCampaignGroup,
  styxScanographyGroup,
  styxScanographyIntro,
  styxScanographyStrip,
  styxShootingsIntro,
  styxSocialInstructionMockupDeck,
} from "./src/data/content/styx.ts";

import { renderAnimatedCanvasGallery } from "./src/templates/animated-canvas-gallery.ts";

import { renderBeforeAfter } from "./src/templates/before-after.ts";

import { renderClientLogo } from "./src/templates/client-logo.ts";

import { renderMediaFigure } from "./src/templates/media-figure.ts";

import { renderMediaGroup } from "./src/templates/media-group.ts";

import { renderJustifiedGallery } from "./src/templates/justified-gallery.ts";

import { renderMediaSlider } from "./src/templates/media-slider.ts";

import { renderPageFlip } from "./src/templates/page-flip.ts";

import { renderMockup } from "./src/templates/mockup.ts";

import { renderMockupDeck } from "./src/templates/mockup-deck.ts";

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

function siteTemplatesPlugin(): Plugin {
  return {
    name: "site-templates",

    transformIndexHtml(html) {
      const projectCards = projects.map(renderProjectCard).join("\n");

      const logos = clientLogos.map(renderClientLogo).join("\n");

      const slots: readonly HtmlSlot[] = [
        ["<!-- PROJECT_CARDS -->", projectCards],

        ["<!-- CLIENT_LOGOS -->", logos],

        ["<!-- PORTFOLIO_SHOOTINGS_STRIP -->", renderMediaGroup(portfolioShootingsStrip)],
        ["<!-- PORTFOLIO_SENSETIQUE_STRIP -->", renderMediaGroup(portfolioSensetiqueStrip)],
        ["<!-- PORTFOLIO_SCANOGRAPHY_STRIP -->", renderMediaGroup(portfolioScanographyStrip)],

        /* ==============================
             Jestei Pool
             ============================== */

        ["<!-- JESTEI_INTRO -->", renderProjectIntro(jesteiIntro)],

        ["<!-- JESTEI_FEATURED_MEDIA -->", renderMediaFigure(jesteiFeaturedMedia)],

        ["<!-- JESTEI_HOME_INTRO -->", renderSectionIntro(jesteiHomeIntro)],

        ["<!-- JESTEI_HOME_MOCKUP -->", renderMockup(jesteiHomeMockup)],

        ["<!-- JESTEI_BRAND_INTRO -->", renderSectionIntro(jesteiBrandIntro)],

        ["<!-- JESTEI_BRAND_SYSTEM_GROUP -->", renderMediaGroup(jesteiBrandSystemGroup)],

        ["<!-- JESTEI_INTERFACE_INTRO -->", renderSectionIntro(jesteiInterfaceIntro)],

        ["<!-- JESTEI_INTERFACE_GROUP -->", renderMediaGroup(jesteiInterfaceGroup)],

        ["<!-- JESTEI_EDITORIAL_INTRO -->", renderSectionIntro(jesteiEditorialIntro)],

        ["<!-- JESTEI_REDPOLITIKA_MOCKUP -->", renderMockup(jesteiRedpolitikaMockup)],

        ["<!-- JESTEI_EVENT_INTRO -->", renderSectionIntro(jesteiEventIntro)],

        ["<!-- JESTEI_EVENT_GROUP -->", renderMediaGroup(jesteiEventGroup)],

        ["<!-- JESTEI_LANDINGS_INTRO -->", renderSectionIntro(jesteiLandingsIntro)],

        ["<!-- JESTEI_LANDINGS_MOCKUP -->", renderMockup(jesteiLandingsMockup)],

        ["<!-- JESTEI_PROMO_INTRO -->", renderSectionIntro(jesteiPromoIntro)],

        ["<!-- JESTEI_SUBSCRIPTION_BEFORE_AFTER -->", renderBeforeAfter(jesteiSubscriptionBeforeAfter)],

        ["<!-- JESTEI_INSTAGRAM_PLAYER_STRIP -->", renderMediaGroup(jesteiInstagramPlayerStrip)],
        ["<!-- JESTEI_PROMO_SEQUENCE -->", renderMediaGroup(jesteiPromoSequence)],

        /* ==============================
             Styx
             ============================== */

        ["<!-- STYX_INTRO -->", renderProjectIntro(styxIntro)],

        ["<!-- STYX_BRAND_INTRO -->", renderSectionIntro(styxBrandIntro)],

        ["<!-- STYX_LOGO_BANNER -->", renderMediaFigure(styxLogoBanner)],

        ["<!-- STYX_PRODUCTION_MOCKUP_DECK -->", renderMockupDeck(styxProductionMockupDeck)],

        ["<!-- STYX_PRODUCTION_INTRO -->", renderSectionIntro(styxProductionIntro)],

        ["<!-- STYX_PRODUCTION_MEDIA_GROUP -->", renderMediaGroup(styxProductionMediaGroup)],

        ["<!-- STYX_SCANOGRAPHY_INTRO -->", renderSectionIntro(styxScanographyIntro)],

        ["<!-- STYX_SCANOGRAPHY_GROUP -->", renderMediaGroup(styxScanographyGroup)],

        ["<!-- STYX_PRINT_LINKS_GROUP -->", renderMediaGroup(styxPrintLinksGroup)],

        [
          "<!-- STYX_SCANOGRAPHY_CAMPAIGN_GROUP -->",
          renderMediaGroup(styxScanographyCampaignGroup),
        ],

        ["<!-- STYX_CATALOG_MOCKUP -->", renderMockup(styxCatalogMockup)],

        ["<!-- STYX_SHOOTINGS_INTRO -->", renderSectionIntro(styxShootingsIntro)],

        ["<!-- STYX_LOOKBOOK_INTRO -->", renderSectionIntro(styxLookbookIntro)],

        ["<!-- STYX_BRAND_LOOKBOOK_REEL -->", renderMediaGroup(styxBrandLookbookReel)],
        ["<!-- STYX_LOOKBOOK_MASONRY_GROUP -->", renderMediaGroup(styxLookbookMasonryGroup)],
        ["<!-- STYX_GIFT_CERTIFICATE_SLIDER -->", renderMediaSlider(styxGiftCertificateSlider)],
        ["<!-- STYX_SCANOGRAPHY_STRIP -->", renderMediaGroup(styxScanographyStrip)],
        ["<!-- STYX_LOOKBOOK2025_REEL -->", renderMediaGroup(styxLookbook2025Reel)],
        ["<!-- STYX_SOCIAL_INSTRUCTION_MOCKUP_DECK -->", renderMockupDeck(styxSocialInstructionMockupDeck)],

        /* ==============================
             Sensetique
             ============================== */

        ["<!-- SENSETIQUE_INTRO -->", renderProjectIntro(sensetiqueIntro)],

        ["<!-- SENSETIQUE_STUDIO_MOCKUP_DECK -->", renderMockupDeck(sensetiqueStudioMockupDeck)],

        ["<!-- SENSETIQUE_STUDIO_INTRO -->", renderSectionIntro(sensetiqueStudioIntro)],

        ["<!-- SENSETIQUE_STUDIO_JUSTIFIED_GALLERY -->", renderJustifiedGallery(sensetiqueStudioJustifiedGallery)],

        ["<!-- SENSETIQUE_PRODUCTION_INTRO -->", renderSectionIntro(sensetiqueProductionIntro)],

        ["<!-- SENSETIQUE_BURO247_GROUP -->", renderMediaGroup(sensetiqueBuro247Group)],

        [
          "<!-- SENSETIQUE_OLOVO_BOOKLET_GROUP -->",
          renderMediaGroup(sensetiqueOlovoBookletGroup),
        ],

        [
          "<!-- SENSETIQUE_TATIANA_NIKISHINA_GROUP -->",
          renderMediaGroup(sensetiqueTatianaNikishinaEditorialGroup),
        ],

        [
          "<!-- SENSETIQUE_KATYA_KNYAZEVA_GROUP -->",
          renderMediaGroup(sensetiqueKatyaKnyazevaEditorialGroup),
        ],

        [
          "<!-- SENSETIQUE_YURI_IVANOV_GROUP -->",
          renderMediaGroup(sensetiqueYuriIvanovEditorialGroup),
        ],

        ["<!-- SENSETIQUE_STUDIO_INFINITE_STRIP -->", renderMediaGroup(sensetiqueStudioInfiniteStrip)],
        ["<!-- SENSETIQUE_HARSH_LIGHT_SLIDER -->", renderMediaSlider(sensetiqueHarshLightSlider)],
        ["<!-- SENSETIQUE_HARSH_LIGHT_STRIP -->", renderMediaGroup(sensetiqueHarshLightStrip)],
        ["<!-- SENSETIQUE_RAPUTO_EDITORIAL_STRIP -->", renderMediaGroup(sensetiqueRaputoEditorialStrip)],
        ["<!-- SENSETIQUE_YOUNG_PIONEER_SEQUENCE -->", renderMediaGroup(sensetiqueYoungPioneerSequence)],
        [
          "<!-- SENSETIQUE_KRASOTA_DRESS_VIDEO -->",
          renderMediaFigure(sensetiqueKrasotaDressVideo, { mediaDimensions: false }),
        ],
        ["<!-- SENSETIQUE_KRASOTA_DRESS_STRIP -->", renderMediaGroup(sensetiqueKrasotaDressStrip)],
        [
          "<!-- SENSETIQUE_OLOVO_BACKSTAGE_VIDEO -->",
          renderMediaFigure(sensetiqueOlovoBackstageVideo, { mediaDimensions: false }),
        ],
        ["<!-- SENSETIQUE_OLOVO_CAMPAIGN_STRIP -->", renderMediaGroup(sensetiqueOlovoCampaignStrip)],
        ["<!-- SENSETIQUE_OLOVO_LOOKBOOK2016_REEL -->", renderMediaGroup(sensetiqueOlovoLookbook2016Reel)],
        ["<!-- SENSETIQUE_OLOVO_LOOKBOOK2018_REEL -->", renderMediaGroup(sensetiqueOlovoLookbook2018Reel)],
        ["<!-- SENSETIQUE_INNA_HONOUR_REEL -->", renderMediaGroup(sensetiqueInnaHonourReel)],
        ["<!-- SENSETIQUE_OLOVO_ARCHITECTURE_STRIP -->", renderMediaGroup(sensetiqueOlovoArchitectureStrip)],
        ["<!-- SENSETIQUE_DIGITAL_FEAR_PAGE_FLIP -->", renderPageFlip(sensetiqueDigitalFearPageFlip)],
        ["<!-- SENSETIQUE_CHAPURIN_BENTO_GROUP -->", renderMediaGroup(sensetiqueChapurinBentoGroup)],
        ["<!-- SENSETIQUE_YOUNG_PIONEER_STRIP -->", renderMediaGroup(sensetiqueYoungPioneerStrip)],
        ["<!-- SENSETIQUE_DANIIL_KOROTECHENKOV_SEQUENCE -->", renderMediaGroup(sensetiqueDaniilKorotechenkovSequence)],
        ["<!-- SENSETIQUE_TATIANA_NIKISHINA_SUPPLEMENTAL_REEL -->", renderMediaGroup(sensetiqueTatianaNikishinaSupplementalReel)],
        ["<!-- SENSETIQUE_WOOD_METAL_PANIC_STRIP -->", renderMediaGroup(sensetiqueWoodMetalPanicStrip)],
        ["<!-- SENSETIQUE_IVAN_KRUSHINSKY_EDITORIAL_STRIP -->", renderMediaGroup(sensetiqueIvanKrushinskyEditorialStrip)],
        ["<!-- SENSETIQUE_EDITORIAL_PRODUCTION_REEL -->", renderMediaGroup(sensetiqueEditorialProductionReel)],

        /* ==============================
             Shootings
             ============================== */

        ["<!-- SHOOTINGS_INTRO -->", renderProjectIntro(shootingsIntro)],

        ["<!-- SHOOTINGS_OBLADAET_INTRO -->", renderSectionIntro(shootingsObladaetIntro)],

        [
          "<!-- SHOOTINGS_OBLADAET_PORTRAITS_GROUP -->",
          renderMediaGroup(shootingsObladaetPortraitsGroup),
        ],

        ["<!-- SHOOTINGS_OBLADAET_PAIR_GROUP -->", renderMediaGroup(shootingsObladaetPairGroup)],

        ["<!-- SHOOTINGS_EVASHA_INTRO -->", renderSectionIntro(shootingsEvashaIntro)],

        ["<!-- SHOOTINGS_EVASHA_BANNER -->", renderMediaFigure(shootingsEvashaBanner)],

        [
          "<!-- SHOOTINGS_EVASHA_MIXED_GROUP -->",
          renderMediaGroup(shootingsEvashaMixedGroup),
        ],

        ["<!-- SHOOTINGS_EVASHA_PAIR_FIGURE -->", renderMediaFigure(shootingsEvashaPairFigure)],

        [
          "<!-- SHOOTINGS_EVASHA_PORTRAITS_GROUP -->",
          renderMediaGroup(shootingsEvashaPortraitsGroup),
        ],

        ["<!-- SHOOTINGS_IGGUANA_INTRO -->", renderSectionIntro(shootingsIgguanaIntro)],

        ["<!-- SHOOTINGS_ESMI_INTRO -->", renderSectionIntro(shootingsEsmiIntro)],

        ["<!-- SHOOTINGS_ESMI_BANNER -->", renderMediaFigure(shootingsEsmiBanner)],

        ["<!-- SHOOTINGS_HYPRESSION_INTRO -->", renderSectionIntro(shootingsHypressionIntro)],

        ["<!-- SHOOTINGS_HYPRESSION_BANNER -->", renderMediaFigure(shootingsHypressionBanner)],

        [
          "<!-- SHOOTINGS_HYPRESSION_COLLAGE_GROUP -->",
          renderMediaGroup(shootingsHypressionCollageGroup),
        ],

        [
          "<!-- SHOOTINGS_HYPRESSION_MIXED_MEDIA_GROUP -->",
          renderMediaGroup(shootingsHypressionMixedMediaGroup),
        ],

        [
          "<!-- SHOOTINGS_HYPRESSION_PORTRAITS_GROUP -->",
          renderMediaGroup(shootingsHypressionPortraitsGroup),
        ],

        ["<!-- SHOOTINGS_OFELIA_INTRO -->", renderSectionIntro(shootingsOfeliaIntro)],

        ["<!-- SHOOTINGS_OBLADAET_COLLAGE_REEL -->", renderMediaGroup(shootingsObladaetCollageReel)],
        ["<!-- SHOOTINGS_OBLADAET_MIXED_MEDIA_REEL -->", renderMediaGroup(shootingsObladaetMixedMediaReel)],
        ["<!-- SHOOTINGS_EVASHA_PORTRAIT_REEL -->", renderMediaGroup(shootingsEvashaPortraitReel)],
        ["<!-- SHOOTINGS_EVASHA_COVER_REEL -->", renderMediaGroup(shootingsEvashaCoverReel)],
        ["<!-- SHOOTINGS_IGGUANA_MASONRY_GROUP -->", renderMediaGroup(shootingsIgguanaMasonryGroup)],
        ["<!-- SHOOTINGS_OFELIA_STRIP -->", renderMediaGroup(shootingsOfeliaStrip)],

        /* ==============================
             Berry
             ============================== */

        ["<!-- BERRY_INTRO -->", renderProjectIntro(berryIntro)],

        ["<!-- BERRY_STORY_01 -->", renderMockup(berryStoryMockups[0])],

        ["<!-- BERRY_STORY_02 -->", renderMockup(berryStoryMockups[1])],

        ["<!-- BERRY_STORY_03 -->", renderMockup(berryStoryMockups[2])],

        ["<!-- BERRY_STORY_04 -->", renderMockup(berryStoryMockups[3])],

        /* ==============================
             S&S
             ============================== */

        ["<!-- SANDS_INTRO -->", renderProjectIntro(sandsIntro)],

        ["<!-- SANDS_FEATURE_MOCKUP_DECK -->", renderMockupDeck(sandsFeatureMockupDeck)],

        ["<!-- SANDS_LOOKBOOK_STRIP -->", renderMediaGroup(sandsLookbookStrip)],

        /* ==============================
             Awful Cases
             ============================== */

        ["<!-- AWFUL_CASES_INTRO -->", renderProjectIntro(awfulCasesIntro)],

        ["<!-- AWFUL_CASES_DEMO -->", renderMediaFigure(awfulCasesDemo)],

        ["<!-- AWFUL_CASES_SETTINGS_MOCKUP -->", renderMockup(awfulCasesSettingsMockup)],

        /* ==============================
             Moves Awful
             ============================== */

        ["<!-- MOVES_AWFUL_INTRO -->", renderProjectIntro(movesAwfulIntro)],

        ["<!-- MOVES_AWFUL_CANVAS_GALLERY -->", renderAnimatedCanvasGallery(movesAwfulCanvasGallery)],

        ["<!-- MOVES_AWFUL_ANIMATIONS_INTRO -->", renderSectionIntro(movesAwfulAnimationsIntro)],

        ["<!-- MOVES_AWFUL_MEDIA_01 -->", renderMediaFigure(movesAwfulLandingMedia[0])],

        ["<!-- MOVES_AWFUL_MEDIA_02 -->", renderMediaFigure(movesAwfulLandingMedia[1])],

        ["<!-- MOVES_AWFUL_MEDIA_03 -->", renderMediaFigure(movesAwfulLandingMedia[2])],

        /* ==============================
             Professional experience
             ============================== */

        ["<!-- MAD_COW_FILMS_INTRO -->", renderProjectIntro(madCowFilmsIntro)],

        ["<!-- LI_NE_AGENCY_INTRO -->", renderProjectIntro(liNeAgencyIntro)],

        ["<!-- PROGRESS_TRADITION_INTRO -->", renderProjectIntro(progressTraditionIntro)],

        ["<!-- MOSCOW_NEWS_INTRO -->", renderProjectIntro(moskovskieNovostiIntro)],
      ];

      return replaceRequiredSlots(html, slots);
    },
  };
}

export default defineConfig({
  plugins: [siteTemplatesPlugin()],
});
