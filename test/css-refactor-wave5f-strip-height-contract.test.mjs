import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const template = readFileSync(new URL("../src/templates/media-group.ts", import.meta.url), "utf8");
const types = readFileSync(new URL("../src/types/media-group.ts", import.meta.url), "utf8");

test("strip height remains one optional authored input with a local consumer fallback", () => {
  assert.match(
    types,
    /export interface StripMediaGroupData[\s\S]*?layout:\s*"strip";[\s\S]*?height\?:\s*string;/,
  );
  assert.match(
    template,
    /case "strip":[\s\S]*?pushVariable\(variables,\s*"--strip-height",\s*data\.height\);/,
  );
  assert.doesNotMatch(
    media,
    /\.media-group\[data-layout="strip"\]\s*\{\s*--strip-height:\s*clamp\(12rem,\s*34cqi,\s*20rem\);/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="strip"\]\s*\{[\s\S]*?&\s+\.media__surface\s*\{[\s\S]*?block-size:\s*var\(--strip-height,\s*clamp\(12rem,\s*34cqi,\s*20rem\)\);/,
  );
});

test("portfolio strip height specialization does not depend on a specificity bump", () => {
  assert.doesNotMatch(
    components,
    /\.portfolio-showcase__group\s*\{[\s\S]*?--strip-height:\s*var\(--portfolio-strip-height\);[\s\S]*?--group-max:\s*100%;/,
  );
  assert.match(
    components,
    /\.portfolio-showcase__group\[data-layout="strip"\]\s*\{\s*--strip-height:\s*var\(--portfolio-strip-height\);\s*\}/,
  );
  assert.doesNotMatch(
    components,
    /\.media-group\.portfolio-showcase__group\[data-layout="strip"\]\s*\{/,
  );
});

test("strip height cleanup preserves the existing strip justify contract", () => {
  assert.match(
    components,
    /\.portfolio-showcase__group\[data-layout="strip"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--strip-justify:\s*flex-start;/,
  );
  assert.match(
    media,
    /--reel-justify:\s*var\(--strip-justify,\s*safe center\);/,
  );
});
