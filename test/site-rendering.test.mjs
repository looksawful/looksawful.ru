import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { extractElementContainingMarker } from "../src/site/rendering/html.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { jesteiIntro } from "../src/data/content/jestei-pool.ts";

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("homepage source delegates canonical entity composition to one mount", () => {
  assert.match(indexHtml, /<div data-home-entities><\/div>/);
  for (const articleId of [
    "project-jestei",
    "project-styx",
    "project-sensetique",
    "project-shootings",
  ]) {
    assert.doesNotMatch(
      indexHtml,
      new RegExp(`<article\\b[^>]*\\bid=["']${articleId}["'][^>]*>`),
      `${articleId} must not remain as a source-template shell`,
    );
  }
});

test("marker-based extraction returns the complete hidden Project article only", () => {
  const article = extractElementContainingMarker(indexHtml, "article", "<!-- AWFUL_CASES_INTRO -->");
  assert.match(article, /^<article\b[^>]*hidden[^>]*>/);
  assert.match(article, /<!-- AWFUL_CASES_INTRO -->/);
  assert.match(article, /class="media mockup awful-cases-game"/);
  assert.doesNotMatch(article, /<!-- MOVES_AWFUL_INTRO -->/);
});

test("project intro keeps homepage h2 by default and supports standalone h1", () => {
  const homepage = renderProjectIntro(jesteiIntro);
  const standalone = renderProjectIntro(jesteiIntro, { headingLevel: 1 });

  assert.match(homepage, /<h2 class="project__title"/);
  assert.match(standalone, /<h1 class="project__title"/);
  assert.doesNotMatch(standalone, /<h2 class="project__title"/);
});