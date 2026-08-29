import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";
import {
  hasEntityRenderer,
  renderEntityArticle,
} from "../src/site/renderers/registry.ts";

const homepageTemplate = await readFile(new URL("../index.html", import.meta.url), "utf8");
const entityPages = sitePages.filter((page) =>
  page.enabled && (page.type === "case" || page.type === "collection" || page.type === "project"),
);

const expectedRootIds = new Map([
  ["case:jestei-pool", "project-jestei"],
  ["case:styx", "project-styx"],
  ["case:sensetique", "project-sensetique"],
  ["collection:music-photography", "project-shootings"],
  ["project:awful-cases", "project-awful-cases"],
  ["project:moves-awful", "project-moves-awful"],
  ["project:berry-social-content-2020", "project-berry-social-content-2020"],
]);

const allRootIds = [...expectedRootIds.values()];

test("every enabled entity page has an explicit renderer registry entry", () => {
  assert.ok(entityPages.length > 0);
  for (const page of entityPages) {
    assert.equal(hasEntityRenderer(page), true, `missing renderer for ${page.id}`);
  }
});

test("registry renders one isolated project root for every enabled entity page", () => {
  for (const page of entityPages) {
    const article = renderEntityArticle(homepageTemplate, page);
    const expectedRootId = expectedRootIds.get(page.id);
    assert.ok(expectedRootId, `missing expected root fixture for ${page.id}`);

    assert.match(article, /^<article\b/);
    assert.match(article, new RegExp(`\\bid=["']${expectedRootId}["']`));
    assert.equal(
      (article.match(/<h1\b[^>]*class=["'][^"']*\bproject__title\b[^"']*["'][^>]*>/g) ?? []).length,
      1,
      `${page.id} must render exactly one project title h1`,
    );
    assert.doesNotMatch(article, /<!-- [A-Z][A-Z0-9_]+ -->/, `${page.id} left unresolved build markers`);

    for (const otherRootId of allRootIds) {
      if (otherRootId === expectedRootId) continue;
      assert.doesNotMatch(
        article,
        new RegExp(`\\bid=["']${otherRootId}["']`),
        `${page.id} leaked unrelated project root ${otherRootId}`,
      );
    }
  }
});
