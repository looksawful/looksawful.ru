import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const patterns = readFileSync(new URL("../src/styles/patterns.css", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mediaGroup = readFileSync(new URL("../src/templates/media-group.ts", import.meta.url), "utf8");
const sectionRenderer = readFileSync(new URL("../src/site/renderers/entity/section.ts", import.meta.url), "utf8");
const homeSlots = readFileSync(new URL("../src/site/renderers/home/home-slots.ts", import.meta.url), "utf8");
const slider = readFileSync(new URL("../src/styles/slider.css", import.meta.url), "utf8");
const mediaDeck = readFileSync(new URL("../src/styles/media-deck.css", import.meta.url), "utf8");
const mediaSlider = readFileSync(new URL("../src/templates/media-slider.ts", import.meta.url), "utf8");
const mockupDeck = readFileSync(new URL("../src/templates/mockup-deck.ts", import.meta.url), "utf8");
const pageFlip = readFileSync(new URL("../src/styles/page-flip.css", import.meta.url), "utf8");

test("typographic flow uses prose instead of the retired generic flow primitive", () => {
  assert.doesNotMatch(patterns, /\.flow\s*>\s*\*\s*\+\s*\*/);
  assert.doesNotMatch(index, /class="[^"]*\bflow\b[^"]*"/);
  assert.match(index, /class="media-group__head prose"/);
  assert.match(mediaGroup, /className\s*\?\?\s*"prose"/);
  assert.match(sectionRenderer, /class="media-group__head prose"/);
  assert.doesNotMatch(index, /class="project__intro[^"]*\bprose\b[^"]*"/);
  assert.doesNotMatch(index, /\bproject__intro--media\b/);
});


test("live pet-project carousel delegates horizontal mechanics to reel", () => {
  assert.match(homeSlots, /class="pet-projects__grid reel"/);
  assert.match(homeSlots, /--reel-display:\s*grid;/);
  assert.match(homeSlots, /--reel-snap-type:\s*inline mandatory;/);
  assert.match(homeSlots, /--reel-snap-align:\s*center;/);
  assert.match(homeSlots, /--reel-overflow-x:\s*visible;/);
  assert.match(homeSlots, /--reel-overscroll-inline:\s*auto;/);
  assert.doesNotMatch(homeSlots, /\.pet-projects__grid\s*\{[\s\S]*?overflow-x:\s*auto;/);
  assert.doesNotMatch(homeSlots, /\.pet-projects__grid\s*\{[\s\S]*?scrollbar-width:\s*none;/);
  assert.doesNotMatch(homeSlots, /\.pet-projects\s+\.subproject-card\s*\{[^}]*scroll-snap-align:/);
});

test("end-aligned compact control bars share one proven composition pattern", () => {
  assert.match(
    patterns,
    /\.control-bar\s*\{[\s\S]*?--cluster-wrap:\s*nowrap;[\s\S]*?--cluster-justify:\s*flex-end;[\s\S]*?--cluster-space:\s*0\.35rem;/,
  );

  assert.match(mediaSlider, /class="control-bar slider-controls cluster"/);
  assert.match(mockupDeck, /class="control-bar slider-controls cluster"/);
  assert.match(index, /class="control-bar media-deck__toolbar cluster"/);

  assert.doesNotMatch(
    slider,
    /\.slider-controls\s*\{[\s\S]*?--cluster-(?:wrap|justify|space):/,
  );
  assert.doesNotMatch(
    mediaDeck,
    /\.media-deck__toolbar\s*\{[\s\S]*?--cluster-(?:wrap|justify|space):/,
  );

  assert.match(
    pageFlip,
    /\.page-flip__nav\s*\{[\s\S]*?--cluster-justify:\s*center;[\s\S]*?--cluster-space:\s*0\.5rem;/,
  );
});
