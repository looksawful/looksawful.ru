import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { petProjectCards } from "../src/data/pet-project-cards.ts";
import { renderHomepage } from "../src/site/renderers/home/home-slots.ts";
import { renderPetProjectCards } from "../src/templates/subproject-card.ts";

const approvedCards = [
  {
    id: "awful-cases",
    title: "Awful Cases",
    description: "Утилита для Windows: регистр и типографика выделенного текста.",
    state: "live",
    href: "/work/awful-cases/",
  },
  {
    id: "moves-awful",
    title: "Moves Awful",
    description: "Библиотека с шаблонами анимированных canvas галерей для лендингов.",
    state: "live",
    href: "/work/moves-awful/",
  },
  {
    id: "berserk-timer",
    title: "Berserk Timer",
    description: "Консольный помодоро-таймер для Windows.",
    state: "live",
    href: "/work/berserk-timer/",
  },
  {
    id: "awful-studio",
    title: "AWFUL STUDIO",
    description: "Расширение Blender для сборки виртуальной предметной студии.",
    state: "coming-soon",
    href: undefined,
  },
];

test("Pet Projects exposes exactly the approved current cards, copy and release state", () => {
  assert.deepEqual(
    petProjectCards.map(({ id, title, description, state, href }) => ({
      id,
      title,
      description,
      state,
      href,
    })),
    approvedCards,
  );
});

test("live Pet Project cards are links and NEW is an authored badge", () => {
  const html = renderPetProjectCards([
    {
      id: "preview-new",
      title: "Preview New",
      description: "Preview fixture.",
      coverEntryId: "awful-cases-assets-screenshot-2026-08-14-174113-use-01",
      shape: "landscape",
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

test("coming-soon Pet Project cards are semantic non-links", () => {
  const html = renderPetProjectCards([
    {
      id: "preview-coming-soon",
      title: "Preview Coming Soon",
      description: "Preview fixture.",
      coverEntryId: "awful-cases-assets-screenshot-2026-08-14-174113-use-01",
      shape: "landscape",
      source: "site",
      state: "coming-soon",
    },
  ]);

  assert.match(html, /<article\b/);
  assert.match(html, /class="subproject-card__badge"[^>]*>COMING SOON<\/span>/);
  assert.doesNotMatch(html, /<a\b/);
  assert.doesNotMatch(html, /href=/);
});

test("homepage owns Pet Projects composition while CSS owns presentation", () => {
  const source = readFileSync(
    new URL("../src/site/renderers/home/home-slots.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /import \{ petProjectCards \} from "\.\.\/\.\.\/\.\.\/data\/pet-project-cards\.ts";/,
  );
  assert.match(source, /<h2 id="pet-projects-title"[^>]*>Полезное<\/h2>/);
  assert.doesNotMatch(source, /petProjectsPreviewStyles/);
  assert.doesNotMatch(source, /<style>\$\{/);
});

test("disabled Pet Projects are absent from generated Homepage output", () => {
  const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const rendered = renderHomepage(indexHtml);

  assert.doesNotMatch(rendered, /class="pet-projects"/);
  assert.doesNotMatch(rendered, /id="pet-projects-title"/);
  assert.doesNotMatch(rendered, />Полезное</);
});

test("Pet Projects presentation keeps a uniform 4:3 frame and 1 / 2 / 3 column grid", () => {
  const css = readFileSync(
    new URL("../src/styles/subproject-cards.css", import.meta.url),
    "utf8",
  );
  const start = css.indexOf(".pet-projects__grid");
  const end = css.indexOf("@container subproject-card", start);

  assert.notEqual(start, -1, "Pet Projects grid styles must exist");
  assert.notEqual(end, -1, "Pet Projects responsive styles must have a stable boundary");

  const petProjectStyles = css.slice(start, end);

  assert.match(
    css,
    /\.pet-projects \.subproject-card\[data-shape\] \.subproject-card__media\s*\{\s*aspect-ratio:\s*4\s*\/\s*3;\s*\}/,
  );
  assert.match(
    petProjectStyles,
    /\.pet-projects__grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
  );
  assert.match(
    petProjectStyles,
    /@container pet-projects \(width > 42rem\)[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.match(
    petProjectStyles,
    /@container pet-projects \(width > 68rem\)[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.doesNotMatch(petProjectStyles, /repeat\(4,/);
  assert.doesNotMatch(petProjectStyles, /grid-auto-flow:\s*column/);
  assert.doesNotMatch(petProjectStyles, /scroll-snap-type/);
});
