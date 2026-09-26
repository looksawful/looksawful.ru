import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
import { renderWorkPage } from "../src/site/renderers/work-page.ts";
import {
  getProjectIndexPageIds,
  portfolioPresentation,
  validatePortfolioPresentation,
} from "../src/site/pages/portfolio-presentation.ts";

const pluginSource = await readFile(
  new URL("../src/site/build/site-pages-plugin.ts", import.meta.url),
  "utf8",
);
const homepageSource = await readFile(
  new URL("../src/site/pages/homepage.ts", import.meta.url),
  "utf8",
);

const expectedRoutes = new Map([
  ["home", "/"],
  ["gallery", "/gallery/"],
  ["work", "/work/"],
  ["case:jestei-pool", "/work/jestei-pool/"],
  ["case:styx", "/work/styx/"],
  ["case:sensetique", "/work/sensetique/"],
  ["collection:music-photography", "/shootings/"],
  ["project:awful-cases", "/work/awful-cases/"],
  ["project:berserk-timer", "/work/berserk-timer/"],
  ["project:awful-3d-mockups", "/work/awful-3d-mockups/"],
  ["project:awful-mockups", "/work/awful-mockups/"],
  ["project:awful-studio", "/work/awful-studio/"],
  ["project:keys", "/work/keys/"],
  ["project:sea", "/work/sea/"],
  ["project:moves-awful", "/work/moves-awful/"],
  ["project:berry-social-content-2020", "/work/berry-social-content-2020/"],
  ["cv", "/cv/"],
  ["privacy", "/privacy/"],
  ["not-found", "/404.html"],
]);

test("site page manifest validates without errors", () => {
  assert.doesNotThrow(() => validateSitePages(sitePages));
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

test("Work is a canonical listed/indexable Vite SitePage", () => {
  const work = sitePages.find((page) => page.id === "work");
  assert.ok(work, "missing page work");
  assert.deepEqual(
    {
      type: work.type,
      path: work.path,
      enabled: work.enabled,
      listed: work.discovery.listed,
      indexable: work.discovery.indexable,
      renderer: work.renderer,
      build: work.build,
    },
    {
      type: "work",
      path: "/work/",
      enabled: true,
      listed: true,
      indexable: true,
      renderer: "work",
      build: { kind: "vite" },
    },
  );
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

  const berserk = sitePages.find((page) => page.id === "project:berserk-timer");
  assert.ok(berserk && berserk.build.kind === "public-static", "missing public-static Berserk Timer page");
  assert.equal(berserk.renderer, "static-project");
  assert.equal(publicStaticRequestPath(berserk), "/work/berserk-timer/index.html");
  assert.equal(
    publicStaticOutputPath(berserk, "/repo"),
    path.resolve("/repo", "dist/work/berserk-timer/index.html"),
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
    ["project:berserk-timer", { type: "project", entityId: "berserk-timer" }],
    ["project:awful-3d-mockups", { type: "project", entityId: "awful-3d-mockups" }],
    ["project:awful-mockups", { type: "project", entityId: "awful-mockups" }],
    ["project:keys", { type: "project", entityId: "keys" }],
    ["project:sea", { type: "project", entityId: "sea" }],
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

test("Project discovery remains fail-closed until owner approval", () => {
  for (const page of sitePages) {
    if (page.type === "case" || page.type === "collection" || page.type === "gallery" || page.type === "work" || page.id === "cv" || page.id === "privacy") {
      assert.equal(page.discovery.listed, true);
      assert.equal(page.discovery.indexable, true);
    }

    if (page.type === "project") {
      assert.equal(page.discovery.listed, false, page.id);
      assert.equal(page.discovery.indexable, false, page.id);
    }
  }

  const notFound = sitePages.find((page) => page.type === "not-found");
  assert.ok(notFound);
  assert.equal(notFound.discovery.listed, false);
  assert.equal(notFound.discovery.indexable, false);
});

test("central site-pages plugin is orchestration-only", () => {
  assert.doesNotMatch(pluginSource, /404 — Иван Крушинский/);
  assert.doesNotMatch(pluginSource, /Страница не найдена\./);
  assert.doesNotMatch(pluginSource, /tools\/lib\/cv-content\.mjs/);
  assert.doesNotMatch(pluginSource, /src\/content\/cv\.json/);
});

test("Homepage support is derived from executable architecture, not a duplicate allowlist", () => {
  assert.doesNotMatch(homepageSource, /implementedFullRenderers/);
});


test("portfolio presentation keeps exactly three Case-only Flagships", () => {
  assert.doesNotThrow(() => validatePortfolioPresentation(portfolioPresentation, sitePages));
  assert.equal(portfolioPresentation.flagship.length, 3);

  for (const id of portfolioPresentation.flagship) {
    const page = sitePages.find((candidate) => candidate.id === id);
    assert.equal(page?.type, "case", `Flagship must resolve to a Case page: ${id}`);
  }

  assert.throws(
    () => validatePortfolioPresentation(
      { ...portfolioPresentation, flagship: portfolioPresentation.flagship.slice(0, 2) },
      sitePages,
    ),
    /exactly 3 Flagship/i,
  );
});

test("portfolio presentation rejects unknown and duplicate main-tier page ids", () => {
  assert.throws(
    () => validatePortfolioPresentation(
      { ...portfolioPresentation, featured: ["gallery"] },
      sitePages,
    ),
    /entity page/i,
  );

  assert.throws(
    () => validatePortfolioPresentation(
      { ...portfolioPresentation, featured: [portfolioPresentation.flagship[0]] },
      sitePages,
    ),
    /duplicate/i,
  );
});


test("Project index de-duplicates an entity that is both Featured and an index extra", () => {
  const presentation = {
    ...portfolioPresentation,
    featured: [
      "project:awful-cases",
      "project:moves-awful",
      "collection:music-photography",
    ],
  };

  assert.doesNotThrow(() => validatePortfolioPresentation(presentation, sitePages));
  assert.deepEqual(getProjectIndexPageIds(presentation), [
    "case:jestei-pool",
    "case:styx",
    "case:sensetique",
    "collection:music-photography",
    "project:awful-cases",
    "project:moves-awful",
  ]);
});

test("Archive cannot duplicate any entity in the main Project index", () => {
  assert.throws(
    () => validatePortfolioPresentation({
      ...portfolioPresentation,
      archive: ["collection:music-photography"],
    }, sitePages),
    /Archive.*Project index|project index.*Archive|duplicate portfolio tier/i,
  );
});

test("Work shortcuts stay exactly Flagships plus Shootings", () => {
  assert.deepEqual(portfolioPresentation.workShortcuts, [
    ...portfolioPresentation.flagship,
    "collection:music-photography",
  ]);

  assert.throws(
    () => validatePortfolioPresentation({
      ...portfolioPresentation,
      workShortcuts: portfolioPresentation.flagship,
    }, sitePages),
    /Work shortcuts/i,
  );
});

test("A resolved next-Case map must cover every Flagship exactly once", () => {
  assert.doesNotThrow(() => validatePortfolioPresentation({
    ...portfolioPresentation,
    nextCase: {
      "case:jestei-pool": "case:styx",
      "case:styx": "case:sensetique",
      "case:sensetique": "case:jestei-pool",
    },
  }, sitePages));

  assert.throws(
    () => validatePortfolioPresentation({
      ...portfolioPresentation,
      nextCase: {
        "case:jestei-pool": "case:styx",
      },
    }, sitePages),
    /every Flagship/i,
  );
});

test("portfolio presentation validates manual next-Case routes", () => {
  assert.doesNotThrow(() => validatePortfolioPresentation({
    ...portfolioPresentation,
    nextCase: {
      "case:jestei-pool": "case:styx",
      "case:styx": "case:sensetique",
      "case:sensetique": "case:jestei-pool",
    },
  }, sitePages));

  assert.throws(
    () => validatePortfolioPresentation({
      ...portfolioPresentation,
      nextCase: {
        "case:jestei-pool": "case:jestei-pool",
      },
    }, sitePages),
    /cannot point to itself/i,
  );
});

test("portfolio presentation keeps editorial tiers unresolved until owner approval", () => {
  assert.deepEqual(portfolioPresentation.flagship, [
    "case:jestei-pool",
    "case:styx",
    "case:sensetique",
  ]);
  assert.deepEqual(portfolioPresentation.featured, []);
  assert.deepEqual(portfolioPresentation.archive, []);
  assert.deepEqual(getProjectIndexPageIds(portfolioPresentation), [
    "case:jestei-pool",
    "case:styx",
    "case:sensetique",
    "collection:music-photography",
  ]);
});


test("Work page fails closed when Archive contains a non-public entity", () => {
  const page = sitePages.find((candidate) => candidate.id === "work");
  assert.ok(page && page.type === "work");

  assert.throws(
    () => renderWorkPage(page, {
      ...portfolioPresentation,
      projectIndexExtras: [],
      archive: ["project:awful-cases"],
    }),
    /Archive.*listed.*indexable|listed.*indexable.*Archive/i,
  );
});

test("Work page renders the resolved main index and keeps unresolved Archive out of production output", () => {
  const page = sitePages.find((candidate) => candidate.id === "work");
  assert.ok(page && page.type === "work");
  const html = renderWorkPage(page);

  for (const id of getProjectIndexPageIds(portfolioPresentation)) {
    const target = sitePages.find((candidate) => candidate.id === id);
    assert.ok(target);
    assert.match(html, new RegExp(`href="${target.path.replace(/[.*+?^{}()|[\\]\\]/g, "\\$&")}"`));
  }

  assert.doesNotMatch(html, /data-work-archive/);

  const archiveHtml = renderWorkPage(page, {
    ...portfolioPresentation,
    projectIndexExtras: [],
    archive: ["collection:music-photography"],
  });
  assert.match(archiveHtml, /<details[^>]*data-work-archive/);
  assert.doesNotMatch(archiveHtml, /<details[^>]*data-work-archive[^>]*\sopen(?:\s|>)/);
  assert.match(archiveHtml, />Archive<\/summary>/);
  assert.match(archiveHtml, /href="\/shootings\/"/);
  assert.match(archiveHtml, /project-card__type">Collection/);
});
