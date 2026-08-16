import assert from "node:assert/strict";
import test from "node:test";

import {
  findTopLevelProjectArticle,
  injectSensetiqueStyles,
  replaceSensetiqueScene,
} from "../tools/sensetique-index-plugin.mjs";

const scene = (title, inner = "") =>
  `<article class="cv-item"><span class="cv-item__project">${title}</span>${inner}</article>`;

test("findTopLevelProjectArticle includes nested article markup", () => {
  const html = `<div>${scene(
    "Styx Jewels",
    '<article class="nested">nested</article>',
  )}</div>`;
  const result = findTopLevelProjectArticle(html, "Styx Jewels");

  assert.ok(result);
  assert.match(result.html, /class="nested"/);
  assert.match(result.html, /Styx Jewels/);
});

test("replaceSensetiqueScene removes the old scene and inserts the new scene after Styx", () => {
  const html = [
    "<div data-cv-accordion-list>",
    scene("Jestei Pool"),
    scene("Styx Jewels", '<article class="nested">nested</article>'),
    scene("Shootings"),
    scene("Sensetique", '<article class="old-nested">old</article>'),
    "</div>",
  ].join("");
  const replacement = scene("Sensetique", '<div data-version="new"></div>');
  const result = replaceSensetiqueScene(html, replacement);

  assert.equal((result.match(/>Sensetique</g) ?? []).length, 1);
  assert.doesNotMatch(result, /old-nested/);
  assert.match(result, /data-version="new"/);
  assert.ok(result.indexOf("Jestei Pool") < result.indexOf("Styx Jewels"));
  assert.ok(result.indexOf("Styx Jewels") < result.indexOf("Sensetique"));
  assert.ok(result.indexOf("Sensetique") < result.indexOf("Shootings"));
});

test("injectSensetiqueStyles inserts the scoped style only once", () => {
  const first = injectSensetiqueStyles("<html><head></head><body></body></html>", ".x{} ");
  const second = injectSensetiqueStyles(first, ".x{} ");

  assert.equal((second.match(/data-sensetique-case-styles/g) ?? []).length, 1);
  assert.match(second, /\.x\{\}/);
});
