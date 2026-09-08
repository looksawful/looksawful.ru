import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fastTests } from "../tools/ci/run-tests.mjs";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

const sequencePatterns = [
  [/\/\* Sequence = wide \+ middle collection \+ wide\. \*\//, "sequence marker"],
  [/(?:^|\n)\.media-group\[data-layout="sequence"\]\s*\{/, "sequence family"],
  [/(?:^|\n)\.media-group__middle\s*\{/, "sequence middle owner"],
  [/(?:^|\n)\.media-group\[data-layout="sequence"\]\s*>\s*\.media-group__items\s*>\s*\.media-group__middle\s*\{/, "sequence middle integration"],
  [/@container media-group \(width > 48rem\)[\s\S]*?\.media-group\[data-layout="sequence"\]/, "sequence wide-container transition"],
];

test("Wave5E sequence family has one canonical media owner", () => {
  for (const [pattern, label] of sequencePatterns) {
    assert.match(media, pattern, `media.css must own ${label}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${label}`);
  }
});

test("Wave5E sequence keeps authored configuration and intrinsic geometry contract", () => {
  assert.match(
    media,
    /\.media-group\[data-layout="sequence"\]\s*\{[\s\S]*?--sequence-cell:\s*clamp\(5\.5rem,\s*22cqi,\s*8\.5rem\);[\s\S]*?--sequence-ratio:\s*1\s*\/\s*1;[\s\S]*?--sequence-columns:\s*3;/,
  );
  assert.match(
    media,
    /\.media-group__middle\s*\{[\s\S]*?--reel-align:\s*stretch;[\s\S]*?grid-template-rows:\s*repeat\(var\(--sequence-mobile-rows,\s*2\),\s*auto\);[\s\S]*?grid-auto-flow:\s*column;[\s\S]*?grid-auto-columns:\s*var\(--sequence-cell\);/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="sequence"\][\s\S]*?\.media__surface\s*\{[\s\S]*?--media-ratio:\s*var\(--sequence-ratio\);[\s\S]*?--media-block-size:\s*100%;/,
  );
});

test("Wave5E sequence move stops before later media families", () => {
  for (const pattern of [
    /(?:^|\n)\.media-group\[data-layout="masonry"\]/,
    /(?:^|\n)\.media-group\[data-layout="bento"\]/,
    /(?:^|\n)\[data-infinite-reel\]\s*\{/,
  ]) {
    assert.doesNotMatch(media, pattern, `media.css must not absorb later family ${pattern}`);
    assert.match(components, pattern, `components.css must retain later family ${pattern}`);
  }
});

test("Wave5E sequence ownership contract is mandatory in Fast CI", () => {
  assert.equal(fastTests.has("test/css-refactor-wave5e-sequence.test.mjs"), true);
});
