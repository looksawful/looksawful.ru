import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const groupRenderer = readFileSync(new URL("../src/templates/media-group.ts", import.meta.url), "utf8");
const figureRenderer = readFileSync(new URL("../src/templates/media-figure.ts", import.meta.url), "utf8");

const bentoPatterns = [
  [/(?:^|\n)\.media-group\[data-layout="bento"\]\s*>\s*\.media-group__items\s*\{/, "bento items owner"],
  [/(?:^|\n)\.media-group\[data-layout="bento"\]\s+\.media\s*\{/, "bento item placement owner"],
  [/(?:^|\n)\.media-group\[data-layout="bento"\]\s+\.media__surface\s*\{/, "bento surface owner"],
];

test("bento family has one canonical media owner", () => {
  for (const [pattern, label] of bentoPatterns) {
    assert.match(media, pattern, `media.css must own ${label}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${label}`);
  }
});

test("bento preserves compact rail geometry", () => {
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

test("bento preserves wide fixed-grid geometry", () => {
  assert.match(
    media,
    /@container media-group \(width > 48rem\)[\s\S]*?\.media-group\[data-layout="bento"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--reel-overflow-x:\s*visible;[\s\S]*?--reel-overflow-y:\s*visible;[\s\S]*?grid-template-columns:\s*repeat\(var\(--bento-columns,\s*8\),\s*minmax\(0,\s*1fr\)\);[\s\S]*?grid-template-rows:\s*repeat\(var\(--bento-rows,\s*3\),\s*minmax\(0,\s*1fr\)\);[\s\S]*?grid-auto-flow:\s*dense;[\s\S]*?grid-auto-columns:\s*auto;[\s\S]*?block-size:\s*var\(--bento-height,\s*clamp\(30rem,\s*50cqi,\s*46rem\)\);/,
  );
});

test("bento authored inputs stay in typed renderers", () => {
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
