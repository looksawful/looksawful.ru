import assert from "node:assert/strict";
import test from "node:test";

import * as homeCardData from "../src/data/projects.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import { createHomepageSlots } from "../src/site/renderers/home/home-slots.ts";

const expected = new Map([
  ["jestei", { pageId: "case:jestei-pool", path: "/work/jestei-pool/" }],
  ["styx", { pageId: "case:styx", path: "/work/styx/" }],
  ["sensetique", { pageId: "case:sensetique", path: "/work/sensetique/" }],
  ["shootings", { pageId: "collection:music-photography", path: "/shootings/" }],
]);

test("homepage cards own a direct canonical SitePage relation", () => {
  assert.ok(Array.isArray(homeCardData.homeCards), "homeCards must be the homepage-card collection");
  assert.equal("projects" in homeCardData, false, "homepage cards must not export a fake Project catalog");

  for (const card of homeCardData.homeCards) {
    const expectedTarget = expected.get(card.id);
    assert.ok(expectedTarget, `unexpected home card ${card.id}`);
    assert.equal(card.pageId, expectedTarget.pageId);

    const page = sitePages.find((candidate) => candidate.id === card.pageId);
    assert.ok(page, `missing canonical page ${card.pageId}`);
    assert.equal(page.enabled, true);
    assert.equal(page.path, expectedTarget.path);
  }
});

test("homepage card markup links through its canonical SitePage relation", () => {
  const cards = createHomepageSlots().find(([marker]) => marker === "<!-- PROJECT_CARDS -->")?.[1];
  assert.ok(cards);

  for (const { path } of expected.values()) {
    assert.match(cards, new RegExp(`href="${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }

  assert.doesNotMatch(cards, /href="#project-(?:jestei|styx|sensetique|shootings)"/);
});
