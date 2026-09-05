import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  publicStaticOutputPath,
  publicStaticRequestPath,
} from "../src/site/build/public-static.ts";
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
  ["cv", "/cv/"],
  ["privacy", "/privacy/"],
  ["not-found", "/404.html"],
]);

test("site page manifest validates without errors", () => {
  assert.doesNotThrow(() => validateSitePages(sitePages));
});

test("shared portfolio runtime entrypoints are TypeScript-owned", () => {
  assert.equal(existsSync(new URL("../src/main.ts", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/main.js", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/interactive.ts", import.meta.url)), true);
  assert.equal(existsSync(new URL("../src/interactive.js", import.meta.url)), false);
});

test("managed SitePage routes are stable and unique", () => {
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

test("CV and privacy are canonical static SitePages with explicit build ownership", () => {
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

  const privacy = sitePages.find((page) => page.id === "privacy");
  assert.ok(privacy, "missing page privacy");
  assert.deepEqual(
    {
      type: privacy.type,
      path: privacy.path,
      enabled: privacy.enabled,
      listed: privacy.discovery.listed,
      indexable: privacy.discovery.indexable,
      renderer: privacy.renderer,
      build: privacy.build,
    },
    {
      type: "static",
      path: "/privacy/",
      enabled: true,
      listed: true,
      indexable: true,
      renderer: "privacy",
      build: {
        kind: "public-static",
        sourcePath: "public/privacy/index.html",
      },
    },
  );
});

test("public-static sourcePath owns both dev request path and production target", () => {
  const cv = sitePages.find((page) => page.id === "cv");
  assert.ok(cv && cv.build.kind === "public-static", "missing public-static CV page");

  assert.equal(publicStaticRequestPath(cv), "/cv/index.html");
  assert.equal(
    publicStaticOutputPath(cv, "/repo"),
    path.resolve("/repo", "dist/cv/index.html"),
  );

  const privacy = sitePages.find((page) => page.id === "privacy");
  assert.ok(privacy && privacy.build.kind === "public-static", "missing public-static privacy page");
  assert.equal(publicStaticRequestPath(privacy), "/privacy/index.html");
  assert.equal(
    publicStaticOutputPath(privacy, "/repo"),
    path.resolve("/repo", "dist/privacy/index.html"),
  );

  const relocated = {
    ...cv,
    build: {
      kind: "public-static",
      sourcePath: "public/resume-shell/index.html",
    },
  };
  assert.equal(publicStaticRequestPath(relocated), "/resume-shell/index.html");
  assert.equal(
    publicStaticOutputPath(relocated, "/repo"),
    path.resolve("/repo", "dist/resume-shell/index.html"),
  );
});

test("enabled page lookup uses canonical normalized paths", () => {
  assert.equal(normalizePagePath("work/jestei-pool"), "/work/jestei-pool/");
  assert.equal(normalizePagePath("/work/jestei-pool/"), "/work/jestei-pool/");
  assert.equal(normalizePagePath("/404.html"), "/404.html");

  const page = getPageByPath("/work/jestei-pool");
  assert.equal(page?.id, "case:jestei-pool");
  assert.equal(getPageByPath("/cv")?.id, "cv");
  assert.equal(getPageByPath("/privacy")?.id, "privacy");
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

test("only enabled pages are returned for build ownership decisions", () => {
  const enabled = getEnabledSitePages();
  assert.equal(enabled.length, sitePages.filter((page) => page.enabled).length);
  assert.ok(enabled.every((page) => page.enabled));
});

test("public Case, Collection, CV and privacy pages are listed and indexable while selected Project pages stay unlisted", () => {
  for (const page of sitePages) {
    if (page.type === "case" || page.type === "collection" || page.id === "cv" || page.id === "privacy") {
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
