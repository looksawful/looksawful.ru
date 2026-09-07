import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const index = readFileSync(new URL("../src/styles/index.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");

const position = (source, marker) => {
  const value = source.indexOf(marker);
  assert.notEqual(value, -1, `missing marker: ${marker}`);
  return value;
};

test("Wave5B keeps media owner before aggregate component specializations", () => {
  const mediaImport = position(index, '@import "./media.css" layer(components);');
  const componentsImport = position(index, '@import "./components.css" layer(components);');
  assert.ok(mediaImport < componentsImport, "media owner must remain before components.css");
});

test("media owner contains the complete media-group architecture in historical order", () => {
  const order = [
    ".portfolio-showcase__group {",
    '.media-group.portfolio-showcase__group[data-layout="strip"] {',
    ".portfolio-logo-wall {",
    "/* ==================================================\n   Media item",
    "/* ==================================================\n   Media groups",
    ".media-group {",
    ".media-group.brand-system {",
    ".brand-system__surface {",
    ".media-group.jestei-interface-group,",
    ".jestei-event-video-deck {",
    '.media-group[data-layout="sequence"] {',
    '.media-group[data-layout="strip"] {',
    '.media-group[data-layout="editorial"] > .media-group__items {',
    '.media-group[data-layout="masonry"] > .media-group__items {',
    '.media-group[data-layout="bento"] > .media-group__items {',
    "[data-infinite-reel] {",
    "@keyframes infinite-reel-scroll",
  ].map((marker) => position(media, marker));

  for (let index = 1; index < order.length; index += 1) {
    assert.ok(order[index] > order[index - 1], `media ownership order drift at index ${index}: ${order}`);
  }
});

test("components aggregate no longer owns migrated media-group families", () => {
  assert.doesNotMatch(components, /(?:^|\n)\.portfolio-showcase__group\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\.portfolio-showcase__group\[data-layout="strip"\]\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.portfolio-logo-wall\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\.brand-system\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.brand-system__surface\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\.jestei-interface-group,/);
  assert.doesNotMatch(components, /(?:^|\n)\.jestei-event-video-deck\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\[data-layout="sequence"\]\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\[data-layout="strip"\]\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\[data-layout="editorial"\]/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\[data-layout="masonry"\]/);
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\[data-layout="bento"\]/);
  assert.doesNotMatch(components, /(?:^|\n)\[data-infinite-reel\]\s*\{/);
});

test("Wave5B does not absorb interaction or caption owners", () => {
  assert.match(components, /(?:^|\n)\.slider\s*\{/);
  assert.match(components, /(?:^|\n)\.before-after\s*\{/);
  assert.match(components, /(?:^|\n)\.mockup\s*\{/);
  assert.match(components, /(?:^|\n)\.justified-gallery\s*\{/);
  assert.match(components, /(?:^|\n)\.media-deck\s*\{/);
  assert.match(components, /(?:^|\n)\.media-lightbox\s*\{/);
  assert.match(components, /(?:^|\n)\.page-flip\s*\{/);
  assert.match(components, /(?:^|\n)\.berserk-audio\s*\{/);
  assert.match(components, /(?:^|\n)\.portfolio-showcase__item\s+\.media__caption\s*\{/);

  assert.doesNotMatch(media, /(?:^|\n)\.slider\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.before-after\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.mockup\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.media-deck\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.media-lightbox\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.page-flip\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.berserk-audio\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.media__caption\s*\{/);
});
