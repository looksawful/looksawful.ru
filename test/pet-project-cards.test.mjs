import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { USEFUL_PROJECT_DEFINITIONS } from "../src/data/content/useful-projects.ts";
import { petProjectCards } from "../src/data/pet-project-cards.ts";
import { renderHomepage } from "../src/site/renderers/home/home-slots.ts";
import { renderPetProjectCards } from "../src/templates/subproject-card.ts";

const approvedCards = [
  { id: "awful-cases", state: "live", href: "/work/awful-cases/" },
  { id: "moves-awful", state: "live", href: "/work/moves-awful/" },
  { id: "berserk-timer", state: "live", href: "/work/berserk-timer/" },
  { id: "awful-studio", state: "coming-soon", href: undefined },
];

const approvedRegistryIds = [
  "awful-cases",
  "moves-awful",
  "berserk-timer",
  "awful-studio",
  "awful-mockups",
  "awful-textures",
  "photoshop-translation",
  "keys",
  "sea",
  "comfy-workflows",
  "photoshop-workflows",
  "blender-scenes",
  "shaders",
  "3d-assets",
];

const futureProjectIds = approvedRegistryIds.slice(4);

test("Useful exposes exactly the approved current card identities and release state", () => {
  assert.deepEqual(
    petProjectCards.map(({ id, state, href }) => ({ id, state, href })),
    approvedCards,
  );

  for (const card of petProjectCards) {
    assert.ok(card.title.trim().length > 0, `${card.id} needs a title`);
    assert.ok(card.description.trim().length > 0, `${card.id} needs a description`);
  }
});

test("Useful registry keeps future projects hidden without publish-time fields", () => {
  assert.deepEqual(
    USEFUL_PROJECT_DEFINITIONS.map(({ id }) => id),
    approvedRegistryIds,
  );

  for (const id of futureProjectIds) {
    const definition = USEFUL_PROJECT_DEFINITIONS.find((candidate) => candidate.id === id);
    assert.ok(definition, `missing future project ${id}`);
    assert.equal(definition.state, "hidden");
    assert.equal("href" in definition, false, `${id} must not expose a route while hidden`);
    assert.equal("coverEntryId" in definition, false, `${id} must not require a cover while hidden`);
  }

  assert.equal(
    USEFUL_PROJECT_DEFINITIONS.some(({ id }) => id === "awful-3d-mockups"),
    false,
    "obsolete duplicate identity must not remain in the registry",
  );
});

test("live Useful cards are links and the manual new badge is code-owned", () => {
  const html = renderPetProjectCards([
    {
      id: "preview-new",
      title: "Preview New",
      description: "Preview fixture.",
      coverEntryId: "awful-cases-assets-screenshot-2026-08-14-174113-use-01",
      shape: "portrait",
      source: "site",
      state: "live",
      href: "/work/preview-new/",
      badge: "new",
    },
  ]);

  assert.match(html, /<a\b[^>]*href="\/work\/preview-new\/"/);
  assert.match(html, /class="subproject-card__badge"[^>]*>NEW<\/span>/);
  assert.doesNotMatch(html, /COMING SOON/);
});

test("coming-soon Useful cards are semantic non-links with a code-owned badge", () => {
  const html = renderPetProjectCards([
    {
      id: "preview-coming-soon",
      title: "Preview Coming Soon",
      description: "Preview fixture.",
      coverEntryId: "awful-cases-assets-screenshot-2026-08-14-174113-use-01",
      shape: "portrait",
      source: "site",
      state: "coming-soon",
    },
  ]);

  assert.match(html, /<article\b/);
  assert.match(html, /class="subproject-card__badge"[^>]*>COMING SOON<\/span>/);
  assert.doesNotMatch(html, /<a\b/);
  assert.doesNotMatch(html, /href=/);
});

test("homepage renders only the current Useful cards", () => {
  const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const rendered = renderHomepage(indexHtml);

  assert.match(rendered, /class="pet-projects"/);
  assert.match(rendered, /id="pet-projects-title"[^>]*>Полезное<\/h2>/);
  assert.match(rendered, /data-subproject-id="awful-cases"/);
  assert.match(rendered, /data-subproject-id="moves-awful"/);
  assert.match(rendered, /data-subproject-id="berserk-timer"/);
  assert.match(rendered, /data-subproject-id="awful-studio"/);
  assert.match(rendered, />COMING SOON<\/span>/);

  for (const id of futureProjectIds) {
    assert.doesNotMatch(rendered, new RegExp(`data-subproject-id="${id}"`));
  }
});

test("Useful presentation is CSS-owned and remains the existing portrait snap reel", () => {
  const css = readFileSync(
    new URL("../src/styles/pet-projects.css", import.meta.url),
    "utf8",
  );
  const homeRenderer = readFileSync(
    new URL("../src/site/renderers/home/home-slots.ts", import.meta.url),
    "utf8",
  );
  const stylesIndex = readFileSync(
    new URL("../src/styles/index.css", import.meta.url),
    "utf8",
  );

  assert.match(stylesIndex, /@import\s+"\.\/pet-projects\.css"\s+layer\(components\)/);
  assert.match(css, /--pet-card-width:\s*clamp\(/);
  assert.match(css, /grid-auto-flow:\s*column/);
  assert.match(css, /scroll-snap-type:\s*inline mandatory/);
  assert.match(css, /aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(css, /animation-timeline:\s*view\(inline\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /grid-template-columns:\s*repeat\(3,/);
  assert.doesNotMatch(homeRenderer, /const petProjectsStyles/);
  assert.doesNotMatch(homeRenderer, /<style>\$\{petProjectsStyles\}<\/style>/);
});
