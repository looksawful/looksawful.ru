import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

const patterns = [
  /\.media-group\[data-layout="grid"\]:not\(\[data-compact-layout="reel"\]\)\s*>\s*\.media-group__items\s*\{/,
  /\.media-group\[data-layout="grid"\]\[data-overflow="reel"\]\s*>\s*\.media-group__items\s*\{/,
  /\.media-group\[data-layout="grid"\]\[data-overflow="reel"\]\s+\.media__surface\s*\{/,
  /\.media-group\[data-compact-layout="reel"\]\s*>\s*\.media-group__items\s*\{/,
  /@container media-group \(width > 42rem\)/,
];

test("grid and compact layout family has one canonical media owner", () => {
  for (const pattern of patterns) {
    assert.match(media, pattern, `media.css must own ${pattern}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${pattern}`);
  }
});

test("grid, rail and compact authored geometry contract remains intact", () => {
  assert.match(
    media,
    /\.media-group\[data-layout="grid"\]:not\(\[data-compact-layout="reel"\]\)\s*>\s*\.media-group__items\s*\{[\s\S]*?grid-template-columns:\s*repeat\(var\(--group-mobile-columns\),\s*minmax\(0,\s*1fr\)\);[\s\S]*?column-gap:\s*var\(--group-gap\);[\s\S]*?row-gap:\s*var\(--group-row-gap\);/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="grid"\]\[data-overflow="reel"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--reel-display:\s*grid;[\s\S]*?grid-auto-flow:\s*column;[\s\S]*?grid-auto-columns:\s*max-content;/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="grid"\]\[data-overflow="reel"\]\s+\.media__surface\s*\{[\s\S]*?block-size:\s*var\(--group-reel-height,\s*clamp\(11rem,\s*42cqi,\s*18rem\)\);[\s\S]*?object-fit:\s*var\(--object-fit,\s*var\(--media-fit,\s*cover\)\);/,
  );
  assert.match(
    media,
    /\.media-group\[data-compact-layout="reel"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--reel-align:\s*var\(--group-compact-align,\s*flex-start\);[\s\S]*?--reel-item-size:\s*var\(--group-compact-item-size,\s*auto\);/,
  );
});

test("grid and compact media ownership excludes Brand/Jestei specialization", () => {
  const brandSystem = /(?:^|\n)\.media-group\.brand-system\s*\{/;
  assert.doesNotMatch(media, brandSystem);
  assert.match(components, brandSystem);
});

test("generic media-group base shares the canonical media owner", () => {
  assert.match(
    media,
    /\.media-group\s*\{[\s\S]*?--group-gap:\s*var\(--media-group-gap,\s*var\(--project-media-gap,\s*var\(--size-300\)\)\);[\s\S]*?--group-row-gap:\s*var\(--media-group-row-gap,\s*var\(--project-media-row-gap,\s*var\(--group-gap\)\)\);[\s\S]*?container:\s*media-group\s*\/\s*inline-size;/,
  );
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\s*\{/);
});
