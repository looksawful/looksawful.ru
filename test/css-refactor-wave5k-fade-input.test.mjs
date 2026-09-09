import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fastTests } from "../tools/ci/run-tests.mjs";

const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");

const genericInfiniteReelBlock = media.match(/\[data-infinite-reel\]\s*\{[\s\S]*?\n\}/)?.[0] ?? "";

const fadeFallback = "var(--infinite-reel-fade-size, clamp(2rem, 7cqi, 6rem))";

test("Wave5K fade size remains an authored portfolio input", () => {
  assert.match(
    components,
    /\.portfolio-logo-wall\s*\{[\s\S]*?--infinite-reel-fade-size:\s*clamp\(1\.5rem,\s*4cqi,\s*4rem\);/,
  );
});

test("Wave5K generic infinite reel does not overwrite the authored fade input", () => {
  assert.notEqual(genericInfiniteReelBlock, "", "generic infinite-reel owner must exist");
  assert.doesNotMatch(genericInfiniteReelBlock, /--infinite-reel-fade-size\s*:/);
});

test("Wave5K mask consumers provide the generic fade fallback at the read site", () => {
  assert.equal(media.includes(`black ${fadeFallback}`), true);
  assert.equal(media.includes(`black calc(100% - ${fadeFallback})`), true);

  const fallbackOccurrences = media.split(fadeFallback).length - 1;
  assert.equal(fallbackOccurrences, 4, "both prefixed and standard gradients must use the same fallback twice");
});

test("Wave5K fade remediation does not invent a duplicate configuration variable", () => {
  assert.doesNotMatch(`${components}\n${media}`, /--(?:media-group|reel)-infinite-reel-fade-size\s*:/);
});

test("Wave5K fade input contract is mandatory in Fast CI", () => {
  assert.equal(fastTests.has("test/css-refactor-wave5k-fade-input.test.mjs"), true);
});
