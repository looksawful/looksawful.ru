import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const slotsSource = readFileSync("src/site/renderers/home/home-slots.ts", "utf8");
const contentMap = readFileSync("docs/cms-content-map.md", "utf8");

const projectMarkers = [
  ...slotsSource.matchAll(/"<!-- ((?:JESTEI|STYX|SENSETIQUE|SHOOTINGS)_[A-Z0-9_]+) -->"/g),
].map((match) => match[1]);

test("CMS content map defines all ownership classes and project inventories", () => {
  for (const ownership of ["EDITORIAL", "PRESENTATION", "ARCHITECTURE", "GENERATED"]) {
    assert.match(contentMap, new RegExp(`\\b${ownership}\\b`));
  }

  for (const project of ["Jestei Pool", "Styx", "Sensetique", "Shootings"]) {
    assert.match(contentMap, new RegExp(`## ${project.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}`));
  }

  assert.match(contentMap, /Inline authored HTML/i);
  assert.match(contentMap, /Pilot recommendation/i);
});

test("CMS content map classifies every large-project homepage slot", () => {
  assert.ok(projectMarkers.length > 80, `Expected a broad slot inventory, got ${projectMarkers.length}`);

  for (const marker of projectMarkers) {
    assert.match(contentMap, new RegExp(`\\b${marker}\\b`), `Missing CMS classification for ${marker}`);
  }
});

test("CMS content map keeps architecture and generated data outside ordinary CMS ownership", () => {
  for (const field of [
    "route",
    "canonical",
    "listed",
    "indexable",
    "pageType",
    "renderer",
    "className",
    "generated responsive",
  ]) {
    assert.match(contentMap, new RegExp(field, "i"), `Missing protected field/category: ${field}`);
  }

  assert.match(contentMap, /Jestei filter/i);
  assert.match(contentMap, /data-caption-view/i);
});
