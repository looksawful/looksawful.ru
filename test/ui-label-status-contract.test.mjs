import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("sequence position counters share one proven primitive", () => {
  const primitives = read("src/styles/primitives.css");
  const mediaSlider = read("src/templates/media-slider.ts");
  const mockupDeck = read("src/templates/mockup-deck.ts");
  const pageFlip = read("src/templates/page-flip.ts");

  assert.match(primitives, /\.sequence-counter\s*\{/);
  assert.match(primitives, /text-align:\s*center/);
  assert.match(primitives, /font-variant-numeric:\s*tabular-nums/);
  assert.match(mediaSlider, /class="sequence-counter slider-controls__count"/);
  assert.match(mockupDeck, /class="sequence-counter slider-controls__count"/);
  assert.match(pageFlip, /class="sequence-counter page-flip__count"/);
});

test("content indices and project-local badges remain outside the sequence counter role", () => {
  const captions = read("src/components/media-caption-numbering.ts");
  const codeBlock = read("src/components/content/code-block.ts");
  const subproject = read("src/templates/subproject-card.ts");
  const jesteiTheme = read("src/templates/jestei-theme-organism.ts");

  assert.doesNotMatch(captions, /sequence-counter/);
  assert.doesNotMatch(codeBlock, /sequence-counter/);
  assert.doesNotMatch(subproject, /sequence-counter/);
  assert.doesNotMatch(jesteiTheme, /sequence-counter/);
});
