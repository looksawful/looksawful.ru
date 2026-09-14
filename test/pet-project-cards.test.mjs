import assert from "node:assert/strict";
import test from "node:test";

import { petProjectCards } from "../src/data/subproject-cards.ts";
import { renderPetProjectCards } from "../src/templates/subproject-card.ts";

const approvedCards = [
  {
    id: "awful-cases",
    title: "Awful Cases",
    description: "Утилита для Windows: регистр и типографика выделенного текста.",
  },
  {
    id: "moves-awful",
    title: "Moves Awful",
    description: "Библиотека с шаблонами анимированных canvas галерей для лендингов.",
  },
  {
    id: "berserk-timer",
    title: "Berserk Timer",
    description: "Консольный помодоро-таймер для Windows.",
  },
  {
    id: "awful-studio",
    title: "AWFUL STUDIO",
    description: "Расширение Blender для сборки виртуальной предметной студии.",
  },
];

test("Pet Projects exposes exactly the approved current cards and copy", () => {
  assert.deepEqual(
    petProjectCards.map(({ id, title, description }) => ({ id, title, description })),
    approvedCards,
  );

  assert.deepEqual(
    petProjectCards.map(({ href }) => href),
    [
      "/work/awful-cases/",
      "/work/moves-awful/",
      "/work/berserk-timer/",
      "/work/awful-studio/",
    ],
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