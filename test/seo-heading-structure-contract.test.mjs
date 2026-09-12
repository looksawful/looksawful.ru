import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { renderHomepagePage } from "../src/site/renderers/home/home-page.ts";

const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const indexablePortfolioPages = sitePages.filter(
  (page) => page.enabled && page.discovery.indexable && page.renderer === "entity",
);

function headingText(headingHtml) {
  return headingHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test("indexable portfolio pages expose one textual H1 and homepage keeps one document H1", () => {
  const homepage = renderHomepagePage(indexSource);
  assert.equal((homepage.match(/<h1\b/gi) ?? []).length, 1, "homepage must expose exactly one H1");
  assert.ok(indexablePortfolioPages.length > 0, "manifest must expose at least one indexable portfolio page");

  for (const page of indexablePortfolioPages) {
    const html = renderStandaloneEntityPage(page);
    const headings = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
    assert.equal(headings.length, 1, `${page.path} must expose exactly one H1`);
    assert.notEqual(headingText(headings[0]), "", `${page.path} H1 must contain text, not only an image`);
  }
});
