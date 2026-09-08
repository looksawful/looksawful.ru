import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fastTests } from "../tools/ci/run-tests.mjs";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

const finiteFamilies = [
  [/\/\* Sequence = wide \+ middle collection \+ wide\. \*\//, "sequence marker"],
  [/(?:^|\n)\.media-group\[data-layout="sequence"\]\s*\{/, "sequence"],
  [/(?:^|\n)\.media-group\[data-layout="strip"\]\s*\{/, "strip"],
  [/(?:^|\n)\.media-group\[data-layout="editorial"\]\s*>\s*\.media-group__items\s*\{/, "editorial"],
  [/(?:^|\n)\.media-group\[data-layout="masonry"\]\s*>\s*\.media-group__items\s*\{/, "masonry"],
  [/(?:^|\n)\.media-group\[data-layout="bento"\]\s*>\s*\.media-group__items\s*\{/, "bento"],
];

test("Wave5E finite media layout families have one canonical media owner", () => {
  for (const [pattern, label] of finiteFamilies) {
    assert.match(media, pattern, `media.css must own ${label}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${label}`);
  }

  const positions = [
    media.indexOf("/* Sequence = wide + middle collection + wide. */"),
    media.indexOf('.media-group[data-layout="strip"]'),
    media.indexOf('.media-group[data-layout="editorial"]'),
    media.indexOf('.media-group[data-layout="masonry"]'),
    media.indexOf('.media-group[data-layout="bento"]'),
  ];
  assert.ok(positions.every((position) => position >= 0), "all finite family anchors must exist");
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, "finite family source order must be preserved");
});

test("Wave5E stops before infinite reel and interactive Slider ownership", () => {
  assert.doesNotMatch(media, /(?:^|\n)\[data-infinite-reel\]\s*\{/);
  assert.match(components, /(?:^|\n)\[data-infinite-reel\]\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.slider\s*\{/);
  assert.match(components, /(?:^|\n)\.slider\s*\{/);
});

test("Wave5E preserves the explicit portfolio strip input while moving the generic resolver", () => {
  assert.match(
    components,
    /\.portfolio-showcase__group\[data-layout="strip"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--strip-justify:\s*flex-start;/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="strip"\]\s*\{[\s\S]*?--reel-justify:\s*var\(--strip-justify,\s*safe center\);/,
  );
  assert.doesNotMatch(components, /\.media-group\[data-layout="strip"\]\s*\{[\s\S]*?--reel-justify:\s*var\(--strip-justify,\s*safe center\);/);
});

test("Wave5E ownership contract is mandatory in Fast CI", () => {
  assert.equal(fastTests.has("test/css-refactor-wave5e-finite-layouts.test.mjs"), true);
});
