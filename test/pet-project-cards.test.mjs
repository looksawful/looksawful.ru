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
    description: "Утилита для Windows, которая меняет регистр и типографику выделенного текста.",
    state: "live",
    href: "/work/awful-cases/",
  },
  {
    id: "moves-awful",
    title: "Moves Awful",
    description: "Библиотека анимированных галерей для лендингов.",
    state: "live",
    href: "/work/moves-awful/",
  },
  {
    id: "berserk-timer",
    title: "Berserk Timer",
    description: "CLI-таймер с режимом свидетеля и гибкой настройкой длительности.",
    state: "live",
    href: "/work/berserk-timer/",
  },
  {
    id: "awful-studio",
    title: "Awful Studio",
    description: "Blender-native студия для виртуального продакшна и продуктовой рекламы.",
    state: "coming-soon",
    href: undefined,
  },
  {
    id: "awful-mockups",
    title: "Awful Mockups",
    description: "Набор PSD-мокапов для презентации интерфейсов и графики.",
    state: "coming-soon",
    href: undefined,
  },
  {
    id: "awful-3d-mockups",
    title: "Awful 3D Mockups",
    description: "Набор 3D-мокапов устройств для интерфейсов, анимации и рендера.",
    state: "coming-soon",
    href: undefined,
  },
];

test("Useful exposes exactly the approved cards, copy and release state", () => {
  assert.deepEqual(
    petProjectCards.map(({ id, title, description, state, href }) => ({ id, title, description, state, href })),
    approvedCards,
  );
});

test("live Useful cards are links and NEW is an authored badge", () => {
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
      badge: "NEW",
    },
  ]);

  assert.match(html, /<a\b[^>]*href="\/work\/preview-new\/"/);
  assert.match(html, /class="subproject-card__badge"[^>]*>NEW<\/span>/);
  assert.doesNotMatch(html, /soon/);
  assert.doesNotMatch(html, /В разработке/);
});

test("coming-soon Useful cards are semantic non-links with renderer-owned soon state", () => {
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
  assert.match(html, /class="subproject-card__badge"[^>]*>soon<\/span>/);
  assert.doesNotMatch(html, /В разработке/);
  assert.doesNotMatch(html, /<a\b/);
  assert.doesNotMatch(html, /href=/);

  const editorial = JSON.parse(
    readFileSync(new URL("../src/content/editorial/useful-project-cards.json", import.meta.url), "utf8"),
  );
  for (const id of ["awful-studio", "awful-mockups", "awful-3d-mockups"]) {
    assert.equal(editorial.cards[id].badge, "", `${id} lifecycle must not be duplicated as authored badge copy`);
  }
});

test("homepage renders the CMS-backed Useful section", () => {
  const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const rendered = renderHomepage(indexHtml);

  assert.match(rendered, /class="pet-projects"/);
  assert.match(rendered, /id="pet-projects-title"[^>]*>Полезное<\/h2>/);
  assert.match(rendered, />Полезные инструменты, которые я создаю на досуге<\/p>/);
  assert.match(rendered, /data-subproject-id="awful-3d-mockups"/);
  assert.match(rendered, />NEW<\/span>/);
  assert.match(rendered, />soon<\/span>/);
  assert.doesNotMatch(rendered, />В разработке<\/span>/);
});

test("Useful presentation is a uniform portrait snap reel", () => {
  const source = readFileSync(
    new URL("../src/site/renderers/home/home-slots.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /--pet-card-width:\s*clamp\(/);
  assert.match(source, /grid-auto-flow:\s*column/);
  assert.match(source, /scroll-snap-type:\s*inline mandatory/);
  assert.match(source, /aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(source, /animation-timeline:\s*view\(inline\)/);
  assert.match(source, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(source, /grid-template-columns:\s*repeat\(3,/);
});
