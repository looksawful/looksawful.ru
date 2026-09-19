import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const patterns = readFileSync(new URL("../src/styles/patterns.css", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mediaGroup = readFileSync(new URL("../src/templates/media-group.ts", import.meta.url), "utf8");
const sectionRenderer = readFileSync(new URL("../src/site/renderers/entity/section.ts", import.meta.url), "utf8");
const homeSlots = readFileSync(new URL("../src/site/renderers/home/home-slots.ts", import.meta.url), "utf8");

test("typographic flow uses prose instead of the retired generic flow primitive", () => {
  assert.doesNotMatch(patterns, /\.flow\s*>\s*\*\s*\+\s*\*/);
  assert.doesNotMatch(index, /class="[^"]*\bflow\b[^"]*"/);
  assert.match(index, /class="media-group__head prose"/);
  assert.match(mediaGroup, /className\s*\?\?\s*"prose"/);
  assert.match(sectionRenderer, /class="media-group__head prose"/);
});


test("live pet-project carousel delegates horizontal mechanics to reel", () => {
  assert.match(homeSlots, /class="pet-projects__grid reel"/);
  assert.match(homeSlots, /--reel-display:\s*grid;/);
  assert.match(homeSlots, /--reel-snap-type:\s*inline mandatory;/);
  assert.match(homeSlots, /--reel-snap-align:\s*center;/);
  assert.doesNotMatch(homeSlots, /\.pet-projects__grid\s*\{[\s\S]*?overflow-x:\s*auto;/);
  assert.doesNotMatch(homeSlots, /\.pet-projects__grid\s*\{[\s\S]*?scrollbar-width:\s*none;/);
});
