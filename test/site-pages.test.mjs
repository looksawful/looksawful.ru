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
  ["project:awful-cases", "/work/awful-cases/"],
  ["project:moves-awful", "/work/moves-awful/"],
  ["project:berry-social-content-2020", "/work/berry-social-content-2020/"],
  ["not-found", "/404.html"],
]);

test("site page manifest validates without errors", () => {
  assert.doesNotThrow(() => validateSitePages(sitePages));
});

test("managed MPA routes are stable and unique", () => {
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

test("CV is a canonical static SitePage with explicit renderer and build ownership", () => {
  const cv = sitePages.find((page) => page.id === "cv");
  assert.ok(cv, "missing page cv");
  assert.deepEqual(
    {
      type: cv.type,
      path: cv.path,
      enabled: cv.enabled,
      listed: cv.discovery.listed,
      indexable: cv.discovery.indexable,
      renderer: cv.renderer,
      build: cv.build,
    },
    {
      type: "static",
      path: "/cv/",
      enabled: true,
      listed: true,
      indexable: true,
      renderer: "cv",
      build: {
        kind: "public-static",
        sourcePath: "public/cv/index.html",
      },
    },
  );
});

test("enabled page lookup uses canonical normalized paths", () => {
  assert.equal(normalizePagePath("work/jestei-pool"), "/work/jestei-pool/");
  assert.equal(normalizePagePath("/work/jestei-pool/"), "/work/jestei-pool/");
  assert.equal(normalizePagePath("/404.html"), "/404.html");

  const page = getPageByPath("/work/jestei-pool");
  assert.equal(page?.id, "case:jestei-pool");
});

test("entity routes reference the existing domain model", () => {
  const expectedEntities = new Map([
    ["case:jestei-pool", { type: "case", entityId: "jestei-pool" }],
    ["case:styx", { type: "case", entityId: "styx" }],
    ["case:sensetique", { type: "case", entityId: "sensetique" }],
    ["collection:music-photography", { type: "collection", entityId: "music-photography" }],
    ["project:awful-cases", { type: "project", entityId: "awful-cases" }],
    ["project:moves-awful", { type: "project", entityId: "moves-awful" }],
    ["project:berry-social-content-2020", { type: "project", entityId: "berry-social-content-2020" }],
  ]);

  for (const [id, expected] of expectedEntities) {
    const page = sitePages.find((candidate) => candidate.id === id);
    assert.ok(page, `missing entity page ${id}`);
    assert.deepEqual({ type: page.type, entityId: page.entityId }, expected);
  }
});

test("only enabled pages are returned for build inputs", () => {
  const enabled = getEnabledSitePages();
  assert.equal(enabled.length, sitePages.filter((page) => page.enabled).length);
  assert.ok(enabled.every((page) => page.enabled));
});

test("public Case and Collection pages are indexable while selected Project pages stay unlisted", () => {
  for (const page of sitePages) {
    if (page.type === "case" || page.type === "collection") {
      assert.equal(page.discovery.listed, true);
      assert.equal(page.discovery.indexable, true);
    }

    if (page.type === "project") {
      assert.equal(page.discovery.listed, false);
      assert.equal(page.discovery.indexable, false);
    }
  }

  const notFound = sitePages.find((page) => page.type === "not-found");
  assert.ok(notFound);
  assert.equal(notFound.discovery.listed, false);
  assert.equal(notFound.discovery.indexable, false);
});
