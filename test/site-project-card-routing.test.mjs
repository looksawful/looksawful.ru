import assert from "node:assert/strict";
import test from "node:test";

import * as projectCardData from "../src/data/projects.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import { createHomepageSlots } from "../src/site/renderers/home/home-slots.ts";

const expected = new Map([
  ["jestei", { pageId: "case:jestei-pool", path: "/work/jestei-pool/" }],
  ["styx", { pageId: "case:styx", path: "/work/styx/" }],
  ["sensetique", { pageId: "case:sensetique", path: "/work/sensetique/" }],
  ["shootings", { pageId: "collection:music-photography", path: "/shootings/" }],
]);

test("ProjectCardPresentation owns a direct canonical SitePage relation without legacy HomeCard identity", () => {
  assert.ok(Array.isArray(projectCardData.projectCardPresentations));
  assert.equal("projects" in projectCardData, false, "project cards must not export a fake Project catalog");
  assert.equal("homeCards" in projectCardData, false, "legacy HomeCard collection must be removed");
  assert.equal("HOME_CARD_IDS" in projectCardData, false, "legacy HomeCard IDs must be removed");

  for (const card of projectCardData.projectCardPresentations) {
    const expectedTarget = expected.get(card.id);
    assert.ok(expectedTarget, `unexpected project-card presentation ${card.id}`);
    assert.equal(card.pageId, expectedTarget.pageId);

    const page = sitePages.find((candidate) => candidate.id === card.pageId);
    assert.ok(page, `missing canonical page ${card.pageId}`);
    assert.equal(page.enabled, true);
    assert.equal(page.path, expectedTarget.path);
  }
});

test("homepage card markup links through canonical SitePage relations", () => {
  const cards = createHomepageSlots().find(([marker]) => marker === "<!-- PROJECT_CARDS -->")?.[1];
  assert.ok(cards);

  for (const { path } of expected.values()) {
    assert.match(cards, new RegExp(`href="${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }

  assert.doesNotMatch(cards, /href="#project-(?:jestei|styx|sensetique|shootings)"/);
});
