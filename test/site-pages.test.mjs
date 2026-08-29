import assert from "node:assert/strict";
import test from "node:test";

import {
  getEnabledSitePages,
  getPageByPath,
  sitePages,
} from "../src/site/pages/manifest.ts";
import {
  normalizePagePath,
  validateSitePages,
} from "../src/site/pages/validation.ts";

const expectedRoutes = new Map([
  ["home", "/"],
  ["case:jestei-pool", "/work/jestei-pool/"],
  ["case:styx", "/work/styx/"],
  ["case:sensetique", "/work/sensetique/"],
  ["collection:music-photography", "/shootings/"],
  ["not-found", "/404.html"],
]);

test("site page manifest validates without errors", () => {
  assert.doesNotThrow(() => validateSitePages(sitePages));
});

test("initial MPA routes are stable and unique", () => {
  assert.equal(sitePages.length, expectedRoutes.size);
  const ids = new Set(sitePages.map((page) => page.id));
  const paths = new Set(sitePages.map((page) => page.path));
  assert.equal(ids.size, sitePages.length);
  assert.equal(paths.size, sitePages.length);

  for (const [id, path] of expectedRoutes) {
    const page = sitePages.find((candidate) => candidate.id === id);
    assert.ok(page, `missing page ${id}`);
    assert.equal(page.path, path);
  }
});

test("enabled page lookup uses canonical normalized paths", () => {
  assert.equal(normalizePagePath("work/jestei-pool"), "/work/jestei-pool/");
  assert.equal(normalizePagePath("/work/jestei-pool/"), "/work/jestei-pool/");
  assert.equal(normalizePagePath("/404.html"), "/404.html");

  const page = getPageByPath("/work/jestei-pool");
  assert.equal(page?.id, "case:jestei-pool");
});

test("initial entity routes reference the existing domain model", () => {
  const jestei = sitePages.find((page) => page.id === "case:jestei-pool");
  const styx = sitePages.find((page) => page.id === "case:styx");
  const sensetique = sitePages.find((page) => page.id === "case:sensetique");
  const shootings = sitePages.find((page) => page.id === "collection:music-photography");

  assert.deepEqual(jestei && { type: jestei.type, entityId: jestei.entityId }, {
    type: "case",
    entityId: "jestei-pool",
  });
  assert.deepEqual(styx && { type: styx.type, entityId: styx.entityId }, {
    type: "case",
    entityId: "styx",
  });
  assert.deepEqual(sensetique && { type: sensetique.type, entityId: sensetique.entityId }, {
    type: "case",
    entityId: "sensetique",
  });
  assert.deepEqual(shootings && { type: shootings.type, entityId: shootings.entityId }, {
    type: "collection",
    entityId: "music-photography",
  });
});

test("only enabled pages are returned for build inputs", () => {
  const enabled = getEnabledSitePages();
  assert.equal(enabled.length, sitePages.filter((page) => page.enabled).length);
  assert.ok(enabled.every((page) => page.enabled));
});

test("public entity pages are listed and indexable while 404 is not", () => {
  for (const page of sitePages) {
    if (page.type === "case" || page.type === "collection") {
      assert.equal(page.discovery.listed, true);
      assert.equal(page.discovery.indexable, true);
    }
  }

  const notFound = sitePages.find((page) => page.type === "not-found");
  assert.ok(notFound);
  assert.equal(notFound.discovery.listed, false);
  assert.equal(notFound.discovery.indexable, false);
});
