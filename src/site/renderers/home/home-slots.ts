import { clientLogos } from "../../../data/clients.ts";
import {
  awfulCasesDemo,
  awfulCasesIntro,
  awfulCasesSettingsMockup,
} from "../../../data/content/awful-cases.ts";
import { berryIntro, berryStoryMockups } from "../../../data/content/berry.ts";
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
import { portfolioSensetiqueStrip } from "../../../data/content/sensetique.ts";
import { portfolioShootingsStrip } from "../../../data/content/shootings.ts";
import { portfolioScanographyStrip } from "../../../data/content/styx.ts";
import { getVisibleProjectCardPresentations } from "../../../data/projects.ts";

import { renderClientLogo } from "../../../components/composition/client-logo.ts";
import { renderSectionIntro } from "../../../components/composition/section-intro.ts";
import {
  renderMediaFigure,
  renderMediaGroup,
  renderMockup,
  renderMockupDeck,
} from "../../../components/content/index.ts";
import { renderAnimatedCanvasGallery } from "../../../components/specialized/index.ts";
import { renderProjectCard } from "../../../templates/project-card.ts";
import { renderProjectIntro } from "../../../templates/project-intro.ts";
import {
  replaceRequiredSlots,
  type HtmlSlot,
} from "../../rendering/html.ts";

export function createHomepageSlots(): readonly HtmlSlot[] {
  const projectCards = getVisibleProjectCardPresentations().map(renderProjectCard).join("\n");
  const logos = clientLogos.map(renderClientLogo).join("\n");

  return [
    ["<!-- PROJECT_CARDS -->", projectCards],
    ["<!-- CLIENT_LOGOS -->", logos],
    ["<!-- PORTFOLIO_SHOOTINGS_STRIP -->", renderMediaGroup(portfolioShootingsStrip)],
    ["<!-- PORTFOLIO_SENSETIQUE_STRIP -->", renderMediaGroup(portfolioSensetiqueStrip)],
    ["<!-- PORTFOLIO_SCANOGRAPHY_STRIP -->", renderMediaGroup(portfolioScanographyStrip)],

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
