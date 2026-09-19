import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const patterns = readFileSync(new URL("../src/styles/patterns.css", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mediaGroup = readFileSync(new URL("../src/templates/media-group.ts", import.meta.url), "utf8");
const sectionRenderer = readFileSync(new URL("../src/site/renderers/entity/section.ts", import.meta.url), "utf8");

test("typographic flow uses prose instead of the retired generic flow primitive", () => {
  assert.doesNotMatch(patterns, /\.flow\s*>\s*\*\s*\+\s*\*/);
  assert.doesNotMatch(index, /class="[^"]*\bflow\b[^"]*"/);
  assert.match(index, /class="media-group__head prose"/);
  assert.match(mediaGroup, /className\s*\?\?\s*"prose"/);
  assert.match(sectionRenderer, /class="media-group__head prose"/);
});
