import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";
import { createHomepageSlots, renderHomepage } from "../src/site/renderers/home/home-slots.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { entryRequestToPagePath } from "../src/site/build/site-pages-plugin.ts";

const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");

function page(id) {
  const result = sitePages.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`missing page ${id}`);
  return result;
}

test("homepage renderer supplies every uppercase build-time marker exactly once", () => {
  const authoredMarkers = [...indexHtml.matchAll(/<!-- ([A-Z][A-Z0-9_]+) -->/g)]
    .map((match) => `<!-- ${match[1]} -->`);
  const renderedMarkers = createHomepageSlots().map(([marker]) => marker);

  assert.equal(new Set(renderedMarkers).size, renderedMarkers.length, "renderer markers must be unique");
  for (const marker of authoredMarkers) {
    assert.equal(renderedMarkers.includes(marker), true, `missing renderer for ${marker}`);
  }

  const rendered = renderHomepage(indexHtml);
  for (const marker of authoredMarkers) {
    assert.equal(rendered.includes(marker), false, `unresolved homepage marker ${marker}`);
  }
});

test("standalone Jestei page is isolated from other case DOM and uses h1", () => {
  const html = renderStandaloneEntityPage(indexHtml, page("case:jestei-pool"));
  assert.match(html, /id="project-jestei"/);
  assert.match(html, /<h1 class="project__title"/);
  assert.doesNotMatch(html, /id="project-styx"/);
  assert.doesNotMatch(html, /id="project-sensetique"/);
  assert.doesNotMatch(html, /id="project-shootings"/);
  assert.doesNotMatch(html, /<!-- JESTEI_[A-Z0-9_]+ -->/);
});

test("standalone Shootings page uses the Collection route and excludes case DOM", () => {
  const html = renderStandaloneEntityPage(indexHtml, page("collection:music-photography"));
  assert.match(html, /id="project-shootings"/);
  assert.match(html, /<h1 class="project__title"/);
  assert.doesNotMatch(html, /id="project-jestei"/);
  assert.doesNotMatch(html, /id="project-styx"/);
  assert.doesNotMatch(html, /id="project-sensetique"/);
  assert.doesNotMatch(html, /<!-- SHOOTINGS_[A-Z0-9_]+ -->/);
});

test("unlisted standalone Project pages reuse their exact homepage article bodies", () => {
  const awful = renderStandaloneEntityPage(indexHtml, page("project:awful-cases"));
  assert.match(awful, /id="project-awful-cases"/);
  assert.match(awful, /<h1 class="project__title"/);
  assert.match(awful, /class="media mockup awful-cases-game"/);
  assert.doesNotMatch(awful, /<article\b[^>]*hidden/);
  assert.doesNotMatch(awful, /<!-- AWFUL_CASES_[A-Z0-9_]+ -->/);
  assert.match(awful, /<meta name="robots" content="noindex,nofollow">/);

  const moves = renderStandaloneEntityPage(indexHtml, page("project:moves-awful"));
  assert.match(moves, /id="project-moves-awful"/);
  assert.match(moves, /data-animated-canvas-gallery/);
  assert.doesNotMatch(moves, /<article\b[^>]*hidden/);
  assert.doesNotMatch(moves, /<!-- MOVES_AWFUL_[A-Z0-9_]+ -->/);

  const berry = renderStandaloneEntityPage(indexHtml, page("project:berry-social-content-2020"));
  assert.match(berry, /id="project-berry-social-content-2020"/);
  assert.match(berry, /<h1 class="project__title"/);
  assert.doesNotMatch(berry, /<article\b[^>]*hidden/);
  assert.doesNotMatch(berry, /<!-- BERRY_[A-Z0-9_]+ -->/);
});

test("Vite transform path resolution is explicit and route-safe", () => {
  assert.equal(entryRequestToPagePath("/index.html"), "/");
  assert.equal(entryRequestToPagePath("/work/jestei-pool/index.html"), "/work/jestei-pool/");
  assert.equal(entryRequestToPagePath("/work/awful-cases/index.html"), "/work/awful-cases/");
  assert.equal(entryRequestToPagePath("/shootings/index.html"), "/shootings/");
  assert.equal(entryRequestToPagePath("/404.html"), "/404.html");
});
