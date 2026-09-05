import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  extractElementById,
  extractElementContainingMarker,
} from "../src/site/rendering/html.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { jesteiIntro } from "../src/data/content/jestei-pool.ts";

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("canonical homepage entity source shells contain no legacy body", () => {
  for (const articleId of [
    "project-jestei",
    "project-styx",
    "project-sensetique",
    "project-shootings",
  ]) {
    const article = extractElementById(indexHtml, "article", articleId);
    assert.match(article, new RegExp(`^<article\\b[^>]*\\bid=["']${articleId}["'][^>]*>`));
    const body = article
      .replace(/^<article\b[^>]*>/, "")
      .replace(/<\/article>$/, "");
    assert.equal(body.trim(), "", `${articleId} still carries legacy source-template body`);
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
