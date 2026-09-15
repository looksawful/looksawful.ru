import { clientLogos } from "../../../data/clients.ts";
import {
  awfulCasesDemo,
  awfulCasesIntro,
  awfulCasesSettingsMockup,
} from "../../../data/content/awful-cases.ts";
import { berryIntro, berryStoryMockups } from "../../../data/content/berry.ts";
import { isHomeSectionVisible } from "../../../data/content/home-visibility.ts";
import { usefulProjectsContent } from "../../../data/content/useful-projects.ts";
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
import { petProjectCards } from "../../../data/subproject-cards.ts";

import { renderAnimatedCanvasGallery } from "../../../templates/animated-canvas-gallery.ts";
import { renderClientLogo } from "../../../templates/client-logo.ts";
import { renderMediaFigure } from "../../../templates/media-figure.ts";
import { renderMediaGroup } from "../../../templates/media-group.ts";
import { renderMockup } from "../../../templates/mockup.ts";
import { renderMockupDeck } from "../../../templates/mockup-deck.ts";
import { renderProjectCard } from "../../../templates/project-card.ts";
import { renderProjectIntro } from "../../../templates/project-intro.ts";
import { renderSectionIntro } from "../../../templates/section-intro.ts";
import { renderPetProjectCards } from "../../../templates/subproject-card.ts";
import {
  extractElementContainingMarker,
  replaceRequiredSlots,
  type HtmlSlot,
} from "../../rendering/html.ts";

const petProjectsStyles = `
  .pet-projects {
    --section-inline: max(var(--page-padding-inline), calc((100% - var(--content-wide-width)) / 2 + var(--page-padding-inline)));
    --pet-card-width: clamp(14rem, 72cqi, 19rem);
    --pet-card-gap: clamp(var(--size-200), 2cqi, var(--size-400));
    --pet-edge-space: max(var(--section-inline), calc((100cqi - var(--pet-card-width)) / 2));
    container: pet-projects / inline-size;
    padding-block: var(--size-700);
    overflow: clip;
    border-block-start: var(--border-width-100) solid var(--clr-border);
  }

  .pet-projects > :is(h2, .pet-projects__lead) { margin-inline: var(--section-inline); }
  .pet-projects > h2 { margin-block-end: var(--size-100); font-size: var(--fs-300); font-weight: var(--fw-600); }
  .pet-projects__lead { max-inline-size: 48ch; margin-block-end: var(--size-500); color: var(--clr-text-muted); font-size: var(--fs-300); line-height: var(--lh-copy); }

  .pet-projects__grid {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: var(--pet-card-width);
    align-items: start;
    gap: var(--pet-card-gap);
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: inline mandatory;
    scroll-padding-inline: var(--pet-edge-space);
    padding: var(--size-200) var(--pet-edge-space) var(--size-400);
    scrollbar-width: none;
  }
  .pet-projects__grid::-webkit-scrollbar { display: none; }

  .pet-projects .subproject-card { display: block; min-inline-size: 0; color: inherit; text-decoration: none; scroll-snap-align: center; }
  .pet-projects .subproject-card__figure { display: grid; min-inline-size: 0; margin: 0; transform-origin: center; }
  .pet-projects .subproject-card__media {
    position: relative;
    display: grid;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    background: var(--clr-surface-raised);
    border-radius: clamp(0.875rem, 2.2cqi, 1.375rem);
  }
  .pet-projects .subproject-card__media :is(img, video) { display: block; inline-size: 100%; block-size: 100%; max-inline-size: none; object-fit: cover; object-position: center; }
  .pet-projects .subproject-card__badge {
    position: absolute;
    inset-block-start: var(--size-200);
    inset-inline-start: var(--size-200);
    z-index: 1;
    padding: 0.38em 0.62em;
    border-radius: 999px;
    background: rgb(0 0 0 / 76%);
    color: #fff;
    font-size: var(--fs-100);
    font-weight: var(--fw-600);
    line-height: 1;
    letter-spacing: 0.02em;
  }
  .pet-projects .subproject-card__caption { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--size-100); min-block-size: 6rem; padding-block: var(--size-200) 0; }
  .pet-projects .subproject-card__title { color: var(--clr-text); font-size: var(--fs-300); font-weight: var(--fw-600); line-height: var(--lh-tight); }
  .pet-projects .subproject-card__description {
    display: -webkit-box;
    max-inline-size: 32ch;
    overflow: hidden;
    color: var(--clr-text-muted);
    font-size: var(--fs-200);
    line-height: var(--lh-caption);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
  .pet-projects a.subproject-card:focus-visible { outline: var(--border-width-200) solid currentColor; outline-offset: var(--size-100); border-radius: clamp(0.875rem, 2.2cqi, 1.375rem); }

  @keyframes pet-project-card-focus {
    from, to { scale: 0.95; }
    50% { scale: 1; }
  }
  @supports (animation-timeline: view(inline)) {
    @media (prefers-reduced-motion: no-preference) {
      .pet-projects .subproject-card__figure {
        animation: pet-project-card-focus linear both;
        animation-timeline: view(inline);
        animation-range: cover 20% cover 80%;
      }
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pet-projects .subproject-card__figure { animation: none; scale: 1; }
  }
`;

function renderPetProjectsSection(): string {
  return `
      <style>${petProjectsStyles}</style>
      <section class="pet-projects" aria-labelledby="pet-projects-title" data-reveal-group>
        <h2 id="pet-projects-title" data-reveal="copy">${usefulProjectsContent.section.title}</h2>
        <p class="pet-projects__lead" data-reveal="copy">${usefulProjectsContent.section.description}</p>
        <div class="pet-projects__grid" data-reveal-group>
          ${renderPetProjectCards(petProjectCards)}
        </div>
      </section>`;
}

function injectPetProjectsSection(html: string): string {
  if (!isHomeSectionVisible("pet-projects")) return html;

  const insertionPoint = '<section class="expertise" hidden>';
  if (!html.includes(insertionPoint)) {
    throw new Error("Homepage Pet Projects insertion point is missing.");
  }

  return html.replace(
    insertionPoint,
    `${renderPetProjectsSection()}\n      ${insertionPoint}`,
  );
}

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

export function applyClientLogoWallVisibility(html: string, visible: boolean): string {
  if (visible) return html;

  const logoWallSection = extractElementContainingMarker(
    html,
    "section",
    'aria-labelledby="portfolio-clients-title"',
  );
  return html.replace(logoWallSection, "");
}

export function renderHomepage(html: string): string {
  const rendered = replaceRequiredSlots(html, createHomepageSlots());
  const withPetProjects = injectPetProjectsSection(rendered);
  return applyClientLogoWallVisibility(
    withPetProjects,
    isHomeSectionVisible("client-logo-wall"),
  );
}
