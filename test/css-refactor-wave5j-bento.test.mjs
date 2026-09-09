import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fastTests } from "../tools/ci/run-tests.mjs";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const groupRenderer = readFileSync(new URL("../src/templates/media-group.ts", import.meta.url), "utf8");
const figureRenderer = readFileSync(new URL("../src/templates/media-figure.ts", import.meta.url), "utf8");

const bentoPatterns = [
  [/\/\* Fixed-row bento is a different layout algorithm from column masonry\. \*\//, "bento marker"],
  [/(?:^|\n)\.media-group\[data-layout="bento"\]\s*>\s*\.media-group__items\s*\{/, "bento items owner"],
  [/(?:^|\n)\.media-group\[data-layout="bento"\]\s+\.media\s*\{/, "bento item placement owner"],
  [/(?:^|\n)\.media-group\[data-layout="bento"\]\s+\.media__surface\s*\{/, "bento surface owner"],
];

test("Wave5J bento family has one canonical media owner", () => {
  for (const [pattern, label] of bentoPatterns) {
    assert.match(media, pattern, `media.css must own ${label}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${label}`);
  }
});

test("Wave5J preserves compact bento rail geometry", () => {
  assert.match(
    media,
    /\.media-group\[data-layout="bento"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--reel-display:\s*grid;[\s\S]*?--reel-align:\s*stretch;[\s\S]*?--reel-overflow-y:\s*hidden;[\s\S]*?grid-template-rows:\s*repeat\(var\(--bento-rows,\s*3\),\s*var\(--bento-cell-size,\s*9rem\)\);[\s\S]*?grid-auto-flow:\s*column dense;[\s\S]*?grid-auto-columns:\s*var\(--bento-cell-size,\s*9rem\);/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="bento"\]\s+\.media\s*\{[\s\S]*?grid-column:\s*span var\(--bento-col-span,\s*1\);[\s\S]*?grid-row:\s*span var\(--bento-row-span,\s*1\);[\s\S]*?block-size:\s*100%;/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="bento"\]\s+\.media__surface\s*\{[\s\S]*?block-size:\s*100%;[\s\S]*?aspect-ratio:\s*auto;[\s\S]*?object-fit:\s*cover;/,
  );
});

test("Wave5J preserves wide bento fixed-grid geometry", () => {
  assert.match(
    media,
    /@container media-group \(width > 48rem\)[\s\S]*?\.media-group\[data-layout="bento"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--reel-overflow-x:\s*visible;[\s\S]*?--reel-overflow-y:\s*visible;[\s\S]*?grid-template-columns:\s*repeat\(var\(--bento-columns,\s*8\),\s*minmax\(0,\s*1fr\)\);[\s\S]*?grid-template-rows:\s*repeat\(var\(--bento-rows,\s*3\),\s*minmax\(0,\s*1fr\)\);[\s\S]*?grid-auto-flow:\s*dense;[\s\S]*?grid-auto-columns:\s*auto;[\s\S]*?block-size:\s*var\(--bento-height,\s*clamp\(30rem,\s*50cqi,\s*46rem\)\);/,
  );
});

test("Wave5J keeps bento authored inputs in typed renderers", () => {
  for (const pattern of [
    /pushVariable\(variables,\s*"--bento-rows",\s*data\.rows\);/,
    /pushVariable\(variables,\s*"--bento-columns",\s*data\.columns\);/,
    /pushVariable\(variables,\s*"--bento-cell-size",\s*data\.cellSize\);/,
    /pushVariable\(variables,\s*"--bento-height",\s*data\.height\);/,
  ]) {
    assert.match(groupRenderer, pattern);
  }
  assert.match(figureRenderer, /variables\.push\(`--bento-col-span: \$\{placement\.colSpan\}`\);/);
  assert.match(figureRenderer, /variables\.push\(`--bento-row-span: \$\{placement\.rowSpan\}`\);/);
  assert.doesNotMatch(media, /--bento-(?:rows|columns|cell-size|height|col-span|row-span)\s*:/);
});

test("Wave5J bento remains before infinite reel in media source order", () => {
  const bento = media.indexOf("Fixed-row bento");
  const infiniteReel = media.indexOf("Infinite reel");
  assert.notEqual(bento, -1);
  assert.notEqual(infiniteReel, -1);
  assert.ok(bento < infiniteReel);
});

test("Wave5J bento follows masonry in media source order", () => {
  const masonry = media.indexOf("Column masonry");
  const bento = media.indexOf("Fixed-row bento");
  assert.notEqual(masonry, -1);
  assert.notEqual(bento, -1);
  assert.ok(masonry < bento, "bento must follow the accepted masonry family");
});

test("Wave5J bento ownership contract is mandatory in Fast CI", () => {
  assert.equal(fastTests.has("test/css-refactor-wave5j-bento.test.mjs"), true);
});
