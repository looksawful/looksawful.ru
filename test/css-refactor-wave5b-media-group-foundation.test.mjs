import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const index = readFileSync(new URL("../src/styles/index.css", import.meta.url), "utf8");
const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

const movedSelectors = [
  /(?:^|\n)\.media-group__head\s*\{/,
  /(?:^|\n)\.media-group__items\s*\{/,
  /(?:^|\n)\.media-group\s*>\s*\.media-group__items\.reel,\n\.media-group\s+\.media-group__middle\.reel\s*\{/,
];

test("Wave5B first safe slice moves only media-group substructure to the canonical media owner", () => {
  assert.match(
    index,
    /@import "\.\/patterns\.css" layer\(patterns\);\n@import "\.\/media\.css" layer\(components\);\n@import "\.\/components\.css" layer\(components\);/,
  );

  // Browser parity proved that moving the generic .media-group base earlier in
  // cascade changes portfolio gap behavior, so it intentionally remains in the
  // later components owner until a wider source-order-preserving package exists.
  assert.doesNotMatch(media, /(?:^|\n)\.media-group\s*\{/);
  assert.match(components, /(?:^|\n)\.media-group\s*\{/);

  for (const selector of movedSelectors) {
    assert.match(media, selector, `media.css must own ${selector}`);
    assert.doesNotMatch(components, selector, `components.css must no longer own ${selector}`);
  }
});

test("remaining media-group base preserves the exact historical cascade contract", () => {
  assert.match(
    components,
    /\.media-group\s*\{[\s\S]*?--group-gap:\s*var\(--project-media-gap\);[\s\S]*?--group-row-gap:\s*var\(--project-media-row-gap\);[\s\S]*?--group-columns:\s*2;[\s\S]*?--group-mobile-columns:\s*2;[\s\S]*?container:\s*media-group\s*\/\s*inline-size;[\s\S]*?display:\s*grid;[\s\S]*?inline-size:\s*min\(100%,\s*var\(--group-max,\s*var\(--project-media-max\)\)\);[\s\S]*?min-inline-size:\s*0;/,
  );
  assert.match(media, /\.media-group__head\s*\{[\s\S]*?display:\s*grid;[\s\S]*?gap:\s*0\.35rem;/);
  assert.match(media, /\.media-group__items\s*\{[\s\S]*?min-inline-size:\s*0;/);
  assert.match(
    media,
    /\.media-group\s*>\s*\.media-group__items\.reel,\n\.media-group\s+\.media-group__middle\.reel\s*\{[\s\S]*?--reel-gap:\s*var\(--group-gap\);/,
  );
});

test("Wave5B first safe slice does not absorb layout variants or authored specializations", () => {
  assert.doesNotMatch(media, /(?:^|\n)\.media-group\[data-layout="grid"\]/);
  assert.doesNotMatch(media, /(?:^|\n)\.media-group\[data-compact-layout="reel"\]/);
  assert.doesNotMatch(media, /(?:^|\n)\.media-group\.brand-system\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.media-group\[data-layout="sequence"\]\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.media-group\[data-layout="strip"\]\s*\{/);

  assert.match(components, /(?:^|\n)\.media-group\[data-layout="grid"\]/);
  assert.match(components, /(?:^|\n)\.media-group\[data-compact-layout="reel"\]/);
  assert.match(components, /(?:^|\n)\.media-group\.brand-system\s*\{/);
  assert.match(components, /(?:^|\n)\.media-group\[data-layout="sequence"\]\s*\{/);
});

test("portfolio and project-specific media integration remain outside the canonical substructure owner", () => {
  assert.match(components, /\.media-group\.portfolio-showcase__group\[data-layout="strip"\]/);
  assert.match(components, /\.portfolio-showcase__group\s*\{/);
  assert.match(components, /\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child/);
  assert.doesNotMatch(media, /portfolio-showcase/);
  assert.doesNotMatch(media, /\.project__section\s*>/);
});
