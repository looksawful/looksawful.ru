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

test("balanced element extraction returns only the requested project article", () => {
  const article = extractElementById(indexHtml, "article", "project-jestei");
  assert.match(article, /id="project-jestei"/);
  assert.match(article, /<!-- JESTEI_INTRO -->/);
  assert.doesNotMatch(article, /id="project-styx"/);
  assert.doesNotMatch(article, /id="project-sensetique"/);
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
