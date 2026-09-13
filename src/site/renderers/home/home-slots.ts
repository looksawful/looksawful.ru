import { clientLogos } from "../../../data/clients.ts";
import {
  awfulCasesDemo,
  awfulCasesIntro,
  awfulCasesSettingsMockup,
} from "../../../data/content/awful-cases.ts";
import { berryIntro, berryStoryMockups } from "../../../data/content/berry.ts";
import { isHomeSectionVisible } from "../../../data/content/home-visibility.ts";
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

const petProjectPreviewCards = petProjectCards.map((card) => {
  if (card.id === "awful-cases") return { ...card, href: "/work/awful-cases/" };
  if (card.id === "moves-awful") return { ...card, href: "/work/moves-awful/" };
  return card;
});

const petProjectsPreviewStyles = `
  .pet-projects {
    --section-inline: max(
      var(--page-padding-inline),
      calc((100% - var(--content-wide-width)) / 2 + var(--page-padding-inline))
    );
    container: pet-projects / inline-size;
    padding: var(--size-700) var(--section-inline);
    overflow: clip;
    border-block-start: var(--border-width-100) solid var(--clr-border);
  }

  .pet-projects > h2 {
    margin-block-end: var(--size-400);
    font-size: var(--fs-300);
    font-weight: var(--fw-600);
  }

  .pet-projects__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: var(--space-group) var(--size-300);
  }

  .subproject-card {
    display: block;
    min-inline-size: 0;
    container: subproject-card / inline-size;
    color: inherit;
    text-decoration: none;
  }

  .subproject-card__figure {
    display: grid;
    min-inline-size: 0;
    margin: 0;
  }

  .subproject-card__media {
    --radius-max: var(--radius-poster);
    display: grid;
    min-inline-size: 0;
    overflow: hidden;
    background: var(--clr-surface-raised);
    border-radius: clamp(
      0px,
      calc((100vw - var(--radius-edge-offset) - 100%) * 9999),
      var(--radius-max)
    );
  }

  .subproject-card[data-shape="landscape"] .subproject-card__media {
    aspect-ratio: 16 / 10;
  }

  .subproject-card[data-shape="square"] .subproject-card__media {
    aspect-ratio: 1;
  }

  .subproject-card[data-shape="portrait"] .subproject-card__media {
    aspect-ratio: 3 / 4;
  }

  .subproject-card__media :is(img, video) {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    max-inline-size: none;
    object-fit: cover;
    object-position: center;
    transform: scale(1);
    transition: transform 220ms ease;
  }

  .subproject-card__caption {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--size-100);
    min-block-size: 4.5rem;
    padding-block: var(--size-200);
    color: var(--clr-text-muted);
    font-size: var(--fs-200);
    line-height: var(--lh-caption);
  }

  .subproject-card__title {
    color: var(--clr-text);
    font: inherit;
    font-weight: var(--fw-600);
    line-height: inherit;
  }

  .subproject-card__description {
    max-inline-size: 42ch;
  }

  .subproject-card:is(a:hover, a:focus-visible) .subproject-card__media :is(img, video) {
    transform: scale(1.025);
  }

  .pet-projects .subproject-card {
    inline-size: 100%;
    min-inline-size: 0;
  }

  .pet-projects .subproject-card__media :is(img, video) {
    object-fit: contain;
  }

  .pet-projects .subproject-card:is(a:hover, a:focus-visible) .subproject-card__media :is(img, video) {
    transform: none;
  }

  @container pet-projects (width > 42rem) {
    .pet-projects__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @container pet-projects (width > 68rem) {
    .pet-projects__grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @container subproject-card (width > 20rem) {
    .subproject-card__caption {
      grid-template-columns: minmax(6.5rem, 0.72fr) minmax(0, 1.28fr);
      gap: var(--size-100) var(--size-300);
    }
  }

  @container subproject-card (width > 30rem) {
    .subproject-card__caption {
      grid-template-columns: minmax(8rem, 0.62fr) minmax(0, 1.38fr);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .subproject-card__media :is(img, video) {
      transition: none;
    }

    .subproject-card:is(a:hover, a:focus-visible) .subproject-card__media :is(img, video) {
      transform: none;
    }
  }
`;

function renderPetProjectsSection(): string {
  return `
      <style>${petProjectsPreviewStyles}</style>
      <section class="pet-projects" aria-labelledby="pet-projects-title" data-reveal-group>
        <h2 id="pet-projects-title" data-reveal="copy">Pet Projects</h2>
        <div class="pet-projects__grid" data-reveal-group>
          ${renderPetProjectCards(petProjectPreviewCards)}
        </div>
      </section>`;
}

function injectPetProjectsSection(html: string): string {
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
