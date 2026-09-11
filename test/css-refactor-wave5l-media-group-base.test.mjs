import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

const genericBase = /(?:^|\n)\.media-group\s*\{[\s\S]*?--group-gap:\s*var\(--media-group-gap,\s*var\(--project-media-gap,\s*var\(--size-300\)\)\);[\s\S]*?--group-row-gap:\s*var\(--media-group-row-gap,\s*var\(--project-media-row-gap,\s*var\(--group-gap\)\)\);[\s\S]*?--group-columns:\s*2;[\s\S]*?--group-mobile-columns:\s*2;[\s\S]*?container:\s*media-group\s*\/\s*inline-size;[\s\S]*?display:\s*grid;[\s\S]*?gap:\s*clamp\(0\.9rem,\s*1\.6cqi,\s*1\.5rem\);[\s\S]*?inline-size:\s*min\(100%,\s*var\(--group-max,\s*var\(--project-media-max\)\)\);[\s\S]*?margin-inline:\s*auto;[\s\S]*?min-inline-size:\s*0;[\s\S]*?\}/;

test("generic media-group base belongs to the canonical media owner", () => {
  assert.match(media, genericBase);
  assert.equal(
    (media.match(/(?:^|\n)\.media-group\s*\{/g) ?? []).length,
    1,
    "canonical media owner must contain exactly one generic media-group base",
  );
  assert.doesNotMatch(components, /(?:^|\n)\.media-group\s*\{/);

  const baseIndex = media.search(/(?:^|\n)\.media-group\s*\{/);
  const headIndex = media.search(/(?:^|\n)\.media-group__head\s*\{/);
  assert.ok(baseIndex >= 0 && headIndex >= 0 && baseIndex < headIndex, "generic base must precede media-group substructure");
});

test("authored component specializations stay outside the generic media owner", () => {
  assert.doesNotMatch(media, /(?:^|\n)\.media-group\.brand-system\s*\{/);
  assert.match(components, /(?:^|\n)\.media-group\.brand-system\s*\{/);
  assert.match(components, /\.media-group\.jestei-interface-group,/);
  assert.match(components, /\.media-group\.jestei-event-group\s*\{/);
  assert.doesNotMatch(media, /portfolio-showcase/);
});

test("generic media-group ownership does not depend on specificity compensation", () => {
  const baseMatch = media.match(genericBase);
  assert.ok(baseMatch, "canonical media-group base must exist");
  assert.doesNotMatch(baseMatch[0], /!important/);
  assert.doesNotMatch(baseMatch[0], /--media-group-gap\s*:/);
  assert.doesNotMatch(baseMatch[0], /--media-group-row-gap\s*:/);
});
