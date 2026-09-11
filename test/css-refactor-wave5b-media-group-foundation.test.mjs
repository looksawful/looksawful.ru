import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

const movedSelectors = [
  /(?:^|\n)\.media-group__head\s*\{/,
  /(?:^|\n)\.media-group__items\s*\{/,
  /(?:^|\n)\.media-group\s*>\s*\.media-group__items\.reel,\n\.media-group\s+\.media-group__middle\.reel\s*\{/,
];

test("media-group substructure has one canonical media owner", () => {
  assert.match(media, /(?:^|\n)\.media-group\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\s*\{/);

  for (const selector of movedSelectors) {
    assert.match(media, selector, `media.css must own ${selector}`);
    assert.doesNotMatch(components, selector, `components.css must no longer own ${selector}`);
  }
});

test("media-group spacing resolves explicit specialization inputs before project and system fallbacks", () => {
  assert.doesNotMatch(
    components,
    /\.portfolio-showcase__group\s*\{[\s\S]*?--media-group-gap:\s*var\(--portfolio-group-gap\);[\s\S]*?--group-max:\s*100%;/,
  );
  assert.match(
    components,
    /\.portfolio-logo-wall\s*\{[\s\S]*?--media-group-gap:\s*var\(--portfolio-group-gap\);[\s\S]*?--portfolio-strip-height:/,
  );
  assert.doesNotMatch(
    components,
    /\.portfolio-showcase__group\s*\{[\s\S]*?--group-gap:\s*var\(--portfolio-group-gap\);/,
  );
  assert.match(
    media,
    /\.media-group\s*\{[\s\S]*?--group-gap:\s*var\(--media-group-gap,\s*var\(--project-media-gap,\s*var\(--size-300\)\)\);[\s\S]*?--group-row-gap:\s*var\(--media-group-row-gap,\s*var\(--project-media-row-gap,\s*var\(--group-gap\)\)\);[\s\S]*?--group-columns:\s*2;[\s\S]*?--group-mobile-columns:\s*2;[\s\S]*?container:\s*media-group\s*\/\s*inline-size;[\s\S]*?display:\s*grid;[\s\S]*?inline-size:\s*min\(100%,\s*var\(--group-max,\s*var\(--project-media-max\)\)\);[\s\S]*?min-inline-size:\s*0;/,
  );
  assert.match(media, /\.media-group__head\s*\{[\s\S]*?display:\s*grid;[\s\S]*?gap:\s*0\.35rem;/);
  assert.match(media, /\.media-group__items\s*\{[\s\S]*?min-inline-size:\s*0;/);
  assert.match(
    media,
    /\.media-group\s*>\s*\.media-group__items\.reel,\n\.media-group\s+\.media-group__middle\.reel\s*\{[\s\S]*?--reel-gap:\s*var\(--group-gap\);/,
  );
});

test("media-group core excludes neighboring authored specializations", () => {
  assert.doesNotMatch(media, /(?:^|\n)\.media-group\.brand-system\s*\{/);
  assert.match(components, /(?:^|\n)\.media-group\.brand-system\s*\{/);
});

test("portfolio and project-specific media integration stay outside the canonical substructure owner", () => {
  assert.match(components, /\.portfolio-showcase__group\[data-layout="strip"\]/);
  assert.match(components, /\.portfolio-showcase__group\s*\{/);
  assert.match(components, /\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child/);
  assert.doesNotMatch(media, /portfolio-showcase/);
  assert.doesNotMatch(media, /\.project__section\s*>/);
});
