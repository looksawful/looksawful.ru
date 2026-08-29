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

test("every enabled entity page has an explicit renderer registry entry", () => {
  assert.ok(entityPages.length > 0);
  for (const page of entityPages) {
    assert.equal(hasEntityRenderer(page), true, `missing renderer for ${page.id}`);
  }
});

test("registry renders one isolated article for every enabled entity page", () => {
  for (const page of entityPages) {
    const article = renderEntityArticle(homepageTemplate, page);
    assert.match(article, /^<article\b/);
    assert.equal((article.match(/<article\b/g) ?? []).length, 1, `${page.id} rendered more than one article`);
    assert.equal((article.match(/<h1\b/g) ?? []).length, 1, `${page.id} must render exactly one h1`);
    assert.doesNotMatch(article, /<!-- [A-Z][A-Z0-9_]+ -->/, `${page.id} left unresolved build markers`);
  }
});
