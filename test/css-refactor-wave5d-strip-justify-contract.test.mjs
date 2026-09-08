import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fastTests } from "../tools/ci/run-tests.mjs";

const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const patterns = readFileSync(new URL("../src/styles/patterns.css", import.meta.url), "utf8");

test("portfolio strip justify is an authored input resolved by the generic strip owner", () => {
  assert.match(
    components,
    /@container media-group \(width > 48rem\)\s*\{[\s\S]*?\.portfolio-showcase__group\[data-layout="strip"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--strip-justify:\s*flex-start;[\s\S]*?\}/,
  );
  assert.doesNotMatch(
    components,
    /\.portfolio-showcase__group\[data-layout="strip"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--reel-justify:\s*flex-start;/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="strip"\]\s*\{[\s\S]*?@container media-group \(width > 48rem\)\s*\{[\s\S]*?&\s*>\s*\.media-group__items\s*\{[\s\S]*?--reel-justify:\s*var\(--strip-justify,\s*safe center\);[\s\S]*?\}/,
  );
  assert.doesNotMatch(media, /--reel-justify:\s*safe center;/);
});

test("the reel primitive remains a reader and strip input inheritance stays available", () => {
  assert.match(patterns, /justify-content:\s*var\(--reel-justify,\s*normal\);/);
  assert.doesNotMatch(patterns, /@property\s+--strip-justify/);
  assert.doesNotMatch(components, /@property\s+--strip-justify/);
});

test("Wave5C and Wave5D ownership contracts are mandatory Fast CI tests", () => {
  assert.equal(fastTests.has("test/css-refactor-wave5b-media-group-foundation.test.mjs"), true);
  assert.equal(fastTests.has("test/css-refactor-wave5c-grid-compact.test.mjs"), true);
  assert.equal(fastTests.has("test/css-refactor-wave5d-strip-justify-contract.test.mjs"), true);
});
