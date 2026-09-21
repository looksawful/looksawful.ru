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
  assert.doesNotMatch(index, /class="project__intro[^"]*\bprose\b[^"]*"/);
  assert.doesNotMatch(index, /\bproject__intro--media\b/);
});


test("live pet-project carousel stays horizontal and keeps focus scaling at every width", () => {
  assert.match(homeSlots, /class="pet-projects__grid reel"/);
  assert.match(homeSlots, /--reel-display:\s*grid;/);
  assert.match(homeSlots, /--reel-snap-type:\s*inline mandatory;/);
  assert.match(homeSlots, /--reel-snap-align:\s*center;/);
  assert.match(homeSlots, /grid-auto-flow:\s*column;/);
  assert.match(homeSlots, /animation-timeline:\s*view\(inline\);/);
  assert.match(homeSlots, /@keyframes pet-project-card-focus[\s\S]*?from, to \{ scale:\s*0\.9; \}[\s\S]*?50% \{ scale:\s*1; \}/);
  assert.doesNotMatch(homeSlots, /--reel-overflow-x:\s*visible;/);
  assert.doesNotMatch(homeSlots, /--reel-snap-type:\s*none;/);
  assert.doesNotMatch(homeSlots, /grid-auto-flow:\s*row;/);
  assert.doesNotMatch(homeSlots, /\.pet-projects \.subproject-card__figure \{ animation:\s*none; scale:\s*1; \}/);
});
