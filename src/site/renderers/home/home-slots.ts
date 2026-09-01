import { getVisibleHomeCards } from "../../../data/projects.ts";
import { clientLogos } from "../../../data/clients.ts";

import {
  awfulCasesDemo,
  awfulCasesIntro,
  awfulCasesSettingsMockup,
} from "../../../data/content/awful-cases.ts";
import { berryIntro, berryStoryMockups } from "../../../data/content/berry.ts";
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
} from "../../../data/content/jestei-pool.ts";
import { jesteiThemeOrganismMockup } from "../../../data/content/jestei-theme-organism.ts";
import { liNeAgencyIntro } from "../../../data/content/li-ne-agency.ts";
import { madCowFilmsIntro } from "../../../data/content/mad-cow-films.ts";
import { moskovskieNovostiIntro } from "../../../data/content/moskovskie-novosti.ts";
import {
  movesAwfulAnimationsIntro,
  movesAwfulCanvasGallery,
  movesAwfulIntro,
  movesAwfulLandingMedia,
} from "../../../data/content/moves-awful.ts";
import { progressTraditionIntro } from "../../../data/content/progress-tradition.ts";
import {
  sandsFeatureMockupDeck,
  sandsIntro,
  sandsLookbookStrip,
} from "../../../data/content/sands.ts";
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
} from "../../../data/content/sensetique.ts";
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
} from "../../../data/content/shootings.ts";
import {
  portfolioScanographyStrip,
  styxBrandIntro,
  styxBrandLookbookReel,
  styxCatalogMockup,
  styxGiftCertificateSlider,
  styxIntro,
  styxLogoBanner,
  styxLookbook2025Reel,
  styxLookbookIntro,
  styxLookbookMasonryGroup,
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
} from "../../../data/content/styx.ts";

import { renderAnimatedCanvasGallery } from "../../../templates/animated-canvas-gallery.ts";
import { renderBeforeAfter } from "../../../templates/before-after.ts";
import { renderClientLogo } from "../../../templates/client-logo.ts";
import { renderJustifiedGallery } from "../../../templates/justified-gallery.ts";
import { renderJesteiThemeOrganismMockup } from "../../../templates/jestei-theme-organism.ts";
import { renderMediaFigure } from "../../../templates/media-figure.ts";
import { renderMediaGroup } from "../../../templates/media-group.ts";
import { renderMediaSlider } from "../../../templates/media-slider.ts";
import { renderMockup } from "../../../templates/mockup.ts";
import { renderMockupDeck } from "../../../templates/mockup-deck.ts";
import { renderPageFlip } from "../../../templates/page-flip.ts";
import { renderProjectCard } from "../../../templates/project-card.ts";
import { renderProjectIntro } from "../../../templates/project-intro.ts";
import { renderSectionIntro } from "../../../templates/section-intro.ts";
import {
  replaceRequiredPatterns,
  replaceRequiredSlots,
  type HtmlPatternReplacement,
  type HtmlSlot,
} from "../../rendering/html.ts";

export type HomepageIntroMarker =
  | "JESTEI_INTRO"
  | "STYX_INTRO"
  | "SENSETIQUE_INTRO"
  | "SHOOTINGS_INTRO";

export interface HomepageRenderOptions {
  headingLevel1For?: HomepageIntroMarker;
}

function intro(
  marker: HomepageIntroMarker,
  data: Parameters<typeof renderProjectIntro>[0],
  options: HomepageRenderOptions,
): string {
  return renderProjectIntro(data, {
    headingLevel: options.headingLevel1For === marker ? 1 : 2,
  });
}

export function createHomepageSlots(
  options: HomepageRenderOptions = {},
): readonly HtmlSlot[] {
  const projectCards = getVisibleHomeCards().map(renderProjectCard).join("\n");
  const logos = clientLogos.map(renderClientLogo).join("\n");

  return [
    ["<!-- PROJECT_CARDS -->", projectCards],
    ["<!-- CLIENT_LOGOS -->", logos],
    ["<!-- PORTFOLIO_SHOOTINGS_STRIP -->", renderMediaGroup(portfolioShootingsStrip)],
    ["<!-- PORTFOLIO_SENSETIQUE_STRIP -->", renderMediaGroup(portfolioSensetiqueStrip)],
    ["<!-- PORTFOLIO_SCANOGRAPHY_STRIP -->", renderMediaGroup(portfolioScanographyStrip)],

    ["<!-- JESTEI_INTRO -->", intro("JESTEI_INTRO", jesteiIntro, options)],
    ["<!-- JESTEI_FEATURED_MEDIA -->", renderMediaFigure(jesteiFeaturedMedia)],
    ["<!-- JESTEI_HOME_INTRO -->", renderSectionIntro(jesteiHomeIntro)],
    ["<!-- JESTEI_HOME_MOCKUP -->", renderMockup(jesteiHomeMockup)],
    ["<!-- JESTEI_BRAND_INTRO -->", renderSectionIntro(jesteiBrandIntro)],
    ["<!-- JESTEI_THEME_ORGANISM_MOCKUP -->", renderJesteiThemeOrganismMockup(jesteiThemeOrganismMockup)],
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

    ["<!-- STYX_INTRO -->", intro("STYX_INTRO", styxIntro, options)],
    ["<!-- STYX_BRAND_INTRO -->", renderSectionIntro(styxBrandIntro)],
    ["<!-- STYX_LOGO_BANNER -->", renderMediaFigure(styxLogoBanner)],
    ["<!-- STYX_PRODUCTION_MOCKUP_DECK -->", renderMockupDeck(styxProductionMockupDeck)],
    ["<!-- STYX_PRODUCTION_INTRO -->", renderSectionIntro(styxProductionIntro)],
    ["<!-- STYX_PRODUCTION_MEDIA_GROUP -->", renderMediaGroup(styxProductionMediaGroup)],
    ["<!-- STYX_SCANOGRAPHY_INTRO -->", renderSectionIntro(styxScanographyIntro)],
    ["<!-- STYX_SCANOGRAPHY_GROUP -->", renderMediaGroup(styxScanographyGroup)],
    ["<!-- STYX_PRINT_LINKS_GROUP -->", renderMediaGroup(styxPrintLinksGroup)],
    ["<!-- STYX_SCANOGRAPHY_CAMPAIGN_GROUP -->", renderMediaGroup(styxScanographyCampaignGroup)],
    ["<!-- STYX_CATALOG_MOCKUP -->", renderMockup(styxCatalogMockup)],
    ["<!-- STYX_SHOOTINGS_INTRO -->", renderSectionIntro(styxShootingsIntro)],
    ["<!-- STYX_LOOKBOOK_INTRO -->", renderSectionIntro(styxLookbookIntro)],
    ["<!-- STYX_BRAND_LOOKBOOK_REEL -->", renderMediaGroup(styxBrandLookbookReel)],
    ["<!-- STYX_LOOKBOOK_MASONRY_GROUP -->", renderMediaGroup(styxLookbookMasonryGroup)],
    ["<!-- STYX_GIFT_CERTIFICATE_SLIDER -->", renderMediaSlider(styxGiftCertificateSlider)],
    ["<!-- STYX_SCANOGRAPHY_STRIP -->", renderMediaGroup(styxScanographyStrip)],
    ["<!-- STYX_LOOKBOOK2025_REEL -->", renderMediaGroup(styxLookbook2025Reel)],
    ["<!-- STYX_SOCIAL_INSTRUCTION_MOCKUP_DECK -->", renderMockupDeck(styxSocialInstructionMockupDeck)],

    ["<!-- SENSETIQUE_INTRO -->", intro("SENSETIQUE_INTRO", sensetiqueIntro, options)],
    ["<!-- SENSETIQUE_STUDIO_MOCKUP_DECK -->", renderMockupDeck(sensetiqueStudioMockupDeck)],
    ["<!-- SENSETIQUE_STUDIO_INTRO -->", renderSectionIntro(sensetiqueStudioIntro)],
    ["<!-- SENSETIQUE_STUDIO_JUSTIFIED_GALLERY -->", renderJustifiedGallery(sensetiqueStudioJustifiedGallery)],
    ["<!-- SENSETIQUE_PRODUCTION_INTRO -->", renderSectionIntro(sensetiqueProductionIntro)],
    ["<!-- SENSETIQUE_BURO247_GROUP -->", renderMediaGroup(sensetiqueBuro247Group)],
    ["<!-- SENSETIQUE_OLOVO_BOOKLET_GROUP -->", renderMediaGroup(sensetiqueOlovoBookletGroup)],
    ["<!-- SENSETIQUE_TATIANA_NIKISHINA_GROUP -->", renderMediaGroup(sensetiqueTatianaNikishinaEditorialGroup)],
    ["<!-- SENSETIQUE_KATYA_KNYAZEVA_GROUP -->", renderMediaGroup(sensetiqueKatyaKnyazevaEditorialGroup)],
    ["<!-- SENSETIQUE_YURI_IVANOV_GROUP -->", renderMediaGroup(sensetiqueYuriIvanovEditorialGroup)],
    ["<!-- SENSETIQUE_STUDIO_INFINITE_STRIP -->", renderMediaGroup(sensetiqueStudioInfiniteStrip)],
    ["<!-- SENSETIQUE_HARSH_LIGHT_SLIDER -->", renderMediaSlider(sensetiqueHarshLightSlider)],
    ["<!-- SENSETIQUE_HARSH_LIGHT_STRIP -->", renderMediaGroup(sensetiqueHarshLightStrip)],
    ["<!-- SENSETIQUE_RAPUTO_EDITORIAL_STRIP -->", renderMediaGroup(sensetiqueRaputoEditorialStrip)],
    ["<!-- SENSETIQUE_YOUNG_PIONEER_SEQUENCE -->", renderMediaGroup(sensetiqueYoungPioneerSequence)],
    ["<!-- SENSETIQUE_KRASOTA_DRESS_VIDEO -->", renderMediaFigure(sensetiqueKrasotaDressVideo, { mediaDimensions: false })],
    ["<!-- SENSETIQUE_KRASOTA_DRESS_STRIP -->", renderMediaGroup(sensetiqueKrasotaDressStrip)],
    ["<!-- SENSETIQUE_OLOVO_BACKSTAGE_VIDEO -->", renderMediaFigure(sensetiqueOlovoBackstageVideo, { mediaDimensions: false })],
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

    ["<!-- SHOOTINGS_INTRO -->", intro("SHOOTINGS_INTRO", shootingsIntro, options)],
    ["<!-- SHOOTINGS_OBLADAET_INTRO -->", renderSectionIntro(shootingsObladaetIntro)],
    ["<!-- SHOOTINGS_OBLADAET_PORTRAITS_GROUP -->", renderMediaGroup(shootingsObladaetPortraitsGroup)],
    ["<!-- SHOOTINGS_OBLADAET_PAIR_GROUP -->", renderMediaGroup(shootingsObladaetPairGroup)],
    ["<!-- SHOOTINGS_EVASHA_INTRO -->", renderSectionIntro(shootingsEvashaIntro)],
    ["<!-- SHOOTINGS_EVASHA_BANNER -->", renderMediaFigure(shootingsEvashaBanner)],
    ["<!-- SHOOTINGS_EVASHA_MIXED_GROUP -->", renderMediaGroup(shootingsEvashaMixedGroup)],
    ["<!-- SHOOTINGS_EVASHA_PAIR_FIGURE -->", renderMediaFigure(shootingsEvashaPairFigure)],
    ["<!-- SHOOTINGS_EVASHA_PORTRAITS_GROUP -->", renderMediaGroup(shootingsEvashaPortraitsGroup)],
    ["<!-- SHOOTINGS_IGGUANA_INTRO -->", renderSectionIntro(shootingsIgguanaIntro)],
    ["<!-- SHOOTINGS_ESMI_INTRO -->", renderSectionIntro(shootingsEsmiIntro)],
    ["<!-- SHOOTINGS_ESMI_BANNER -->", renderMediaFigure(shootingsEsmiBanner)],
    ["<!-- SHOOTINGS_HYPRESSION_INTRO -->", renderSectionIntro(shootingsHypressionIntro)],
    ["<!-- SHOOTINGS_HYPRESSION_BANNER -->", renderMediaFigure(shootingsHypressionBanner)],
    ["<!-- SHOOTINGS_HYPRESSION_COLLAGE_GROUP -->", renderMediaGroup(shootingsHypressionCollageGroup)],
    ["<!-- SHOOTINGS_HYPRESSION_MIXED_MEDIA_GROUP -->", renderMediaGroup(shootingsHypressionMixedMediaGroup)],
    ["<!-- SHOOTINGS_HYPRESSION_PORTRAITS_GROUP -->", renderMediaGroup(shootingsHypressionPortraitsGroup)],
    ["<!-- SHOOTINGS_OFELIA_INTRO -->", renderSectionIntro(shootingsOfeliaIntro)],
    ["<!-- SHOOTINGS_OBLADAET_COLLAGE_REEL -->", renderMediaGroup(shootingsObladaetCollageReel)],
    ["<!-- SHOOTINGS_OBLADAET_MIXED_MEDIA_REEL -->", renderMediaGroup(shootingsObladaetMixedMediaReel)],
    ["<!-- SHOOTINGS_EVASHA_PORTRAIT_REEL -->", renderMediaGroup(shootingsEvashaPortraitReel)],
    ["<!-- SHOOTINGS_EVASHA_COVER_REEL -->", renderMediaGroup(shootingsEvashaCoverReel)],
    ["<!-- SHOOTINGS_IGGUANA_MASONRY_GROUP -->", renderMediaGroup(shootingsIgguanaMasonryGroup)],
    ["<!-- SHOOTINGS_OFELIA_STRIP -->", renderMediaGroup(shootingsOfeliaStrip)],

    ["<!-- BERRY_INTRO -->", renderProjectIntro(berryIntro)],
    ["<!-- BERRY_STORY_01 -->", renderMockup(berryStoryMockups[0])],
    ["<!-- BERRY_STORY_02 -->", renderMockup(berryStoryMockups[1])],
    ["<!-- BERRY_STORY_03 -->", renderMockup(berryStoryMockups[2])],
    ["<!-- BERRY_STORY_04 -->", renderMockup(berryStoryMockups[3])],

    ["<!-- SANDS_INTRO -->", renderProjectIntro(sandsIntro)],
    ["<!-- SANDS_FEATURE_MOCKUP_DECK -->", renderMockupDeck(sandsFeatureMockupDeck)],
    ["<!-- SANDS_LOOKBOOK_STRIP -->", renderMediaGroup(sandsLookbookStrip)],

    ["<!-- AWFUL_CASES_INTRO -->", renderProjectIntro(awfulCasesIntro)],
    ["<!-- AWFUL_CASES_DEMO -->", renderMediaFigure(awfulCasesDemo)],
    ["<!-- AWFUL_CASES_SETTINGS_MOCKUP -->", renderMockup(awfulCasesSettingsMockup)],

    ["<!-- MOVES_AWFUL_INTRO -->", renderProjectIntro(movesAwfulIntro)],
    ["<!-- MOVES_AWFUL_CANVAS_GALLERY -->", renderAnimatedCanvasGallery(movesAwfulCanvasGallery)],
    ["<!-- MOVES_AWFUL_ANIMATIONS_INTRO -->", renderSectionIntro(movesAwfulAnimationsIntro, { reveal: false })],
    ["<!-- MOVES_AWFUL_MEDIA_01 -->", renderMediaFigure(movesAwfulLandingMedia[0], { reveal: false })],
    ["<!-- MOVES_AWFUL_MEDIA_02 -->", renderMediaFigure(movesAwfulLandingMedia[1], { reveal: false })],
    ["<!-- MOVES_AWFUL_MEDIA_03 -->", renderMediaFigure(movesAwfulLandingMedia[2], { reveal: false })],

    ["<!-- MAD_COW_FILMS_INTRO -->", renderProjectIntro(madCowFilmsIntro)],
    ["<!-- LI_NE_AGENCY_INTRO -->", renderProjectIntro(liNeAgencyIntro)],
    ["<!-- PROGRESS_TRADITION_INTRO -->", renderProjectIntro(progressTraditionIntro)],
    ["<!-- MOSCOW_NEWS_INTRO -->", renderProjectIntro(moskovskieNovostiIntro)],
  ] as const;
}

const homepageReplacements: readonly HtmlPatternReplacement[] = [
  [
    /<p class="group-note" data-reveal="copy">\s*Вместо одного общего лендинга запустили два\. Каждый собрали из промомодулей под разные рекламные задачи\s*и продуктовые сценарии\.\s*<\/p>/,
    "",
    "stray Jestei landing copy inside Styx",
  ],
  [
    /Новый\s+дизайн системы фильтрации треков\./,
    "Новый интерфейс фильтрации треков.",
    "Jestei filter caption",
  ],
  [
    /Импульсный и постоянный свет, насадки, отражатели и оборудование для съёмок\./,
    "В студии были импульсный и постоянный свет, насадки, отражатели и другое съёмочное оборудование.",
    "Sensetique equipment copy",
  ],
  [
    /Продакшен активно публиковал съёмки и сотрудничал с российскими и европейскими\s+изданиями\./,
    "Публиковали съёмки в российских и европейских изданиях и работали с редакциями над спецпроектами.",
    "Sensetique publications copy",
  ],
  [
    /Продакшен снимал лукбуки, кампейны, видео и каталоги для российских\s+независимых дизайнеров и брендов одежды\./,
    "Для российских независимых дизайнеров и брендов одежды снимали лукбуки, кампейны, видео и каталоги.",
    "Sensetique fashion production copy",
  ],
  [
    /<strong class="credits__title">Olovo Moscow<\/strong>/g,
    "",
    "client-only Olovo Moscow group headings",
  ],
  [
    /В студии проходили мастер-классы и интенсивы с приглашёнными авторами —\s*ещё один способ превратить пространство в работающую творческую среду\./,
    "В студии проводили мастер-классы и интенсивы с приглашёнными авторами.",
    "Sensetique masterclasses copy",
  ],
  [
    /Digital-fear-of-love — адверториал для ювелирного бренда MIMI MOSCOW/g,
    "Digital Fear of Love",
    "Digital Fear of Love title",
  ],
];

export function renderHomepage(
  html: string,
  options: HomepageRenderOptions = {},
): string {
  return replaceRequiredPatterns(
    replaceRequiredSlots(html, createHomepageSlots(options)),
    homepageReplacements,
  );
}
