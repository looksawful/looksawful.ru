import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const renderer = readFileSync(new URL("../src/templates/media-group.ts", import.meta.url), "utf8");

const masonryPatterns = [
  [/(?:^|\n)\.media-group\[data-layout="masonry"\]\s*>\s*\.media-group__items\s*\{/, "masonry items owner"],
  [/(?:^|\n)\.media-group\[data-layout="masonry"\]\s*>\s*\.media-group__items\s*>\s*\.media\s*\{/, "masonry item flow owner"],
];

test("masonry family has one canonical media owner", () => {
  for (const [pattern, label] of masonryPatterns) {
    assert.match(media, pattern, `media.css must own ${label}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${label}`);
  }
});

test("masonry preserves responsive column geometry", () => {
  assert.match(
    media,
    /\.media-group\[data-layout="masonry"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?columns:\s*var\(--masonry-mobile-columns,\s*2\);[\s\S]*?column-gap:\s*var\(--group-gap\);/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="masonry"\]\s*>\s*\.media-group__items\s*>\s*\.media\s*\{[\s\S]*?break-inside:\s*avoid;[\s\S]*?margin-block-end:\s*var\(--group-gap\);/,
  );
  assert.match(
    media,
    /@container media-group \(width > 48rem\)[\s\S]*?\.media-group\[data-layout="masonry"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?columns:\s*var\(--masonry-columns,\s*3\);/,
  );
});

test("masonry authored inputs stay in the typed renderer", () => {
  assert.match(renderer, /pushVariable\(variables,\s*"--masonry-columns",\s*data\.columns\);/);
  assert.match(renderer, /pushVariable\(variables,\s*"--masonry-mobile-columns",\s*data\.mobileColumns\);/);
  assert.doesNotMatch(media, /--masonry-columns\s*:/);
  assert.doesNotMatch(media, /--masonry-mobile-columns\s*:/);
});
