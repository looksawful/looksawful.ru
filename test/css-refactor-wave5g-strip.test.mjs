import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

const stripPatterns = [
  [/(?:^|\n)\.media-group\[data-layout="strip"\]\s*\{/, "generic strip family"],
  [/(?:^|\n)\.media-group\[data-layout="strip"\]\s+\.media__caption\s*\{/, "strip caption sizing"],
];

test("generic strip family has one canonical media owner", () => {
  for (const [pattern, label] of stripPatterns) {
    assert.match(media, pattern, `media.css must own ${label}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${label}`);
  }
});

test("strip preserves intrinsic geometry and resolved configuration", () => {
  assert.match(
    media,
    /\.media-group\[data-layout="strip"\]\s*\{[\s\S]*?>\s*\.media-group__items\s*>\s*\.media\s*\{[\s\S]*?inline-size:\s*max-content;[\s\S]*?max-inline-size:\s*none;/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="strip"\]\s*\{[\s\S]*?&\s+\.media__surface\s*\{[\s\S]*?block-size:\s*var\(--strip-height,\s*clamp\(12rem,\s*34cqi,\s*20rem\)\);[\s\S]*?aspect-ratio:\s*var\(--media-ratio,\s*1\);[\s\S]*?object-fit:\s*contain;[\s\S]*?object-position:\s*center;[\s\S]*?&\s*>\s*picture\s*\{[\s\S]*?display:\s*contents;/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="strip"\]\s*\{[\s\S]*?@container media-group \(width > 48rem\)[\s\S]*?--reel-justify:\s*var\(--strip-justify,\s*safe center\);/,
  );
  assert.match(
    media,
    /\.media-group\[data-layout="strip"\]\s+\.media__caption\s*\{[\s\S]*?inline-size:\s*0;[\s\S]*?min-inline-size:\s*100%;[\s\S]*?max-inline-size:\s*100%;/,
  );
});

test("portfolio strip inputs stay in the component owner", () => {
  assert.match(
    components,
    /\.portfolio-showcase__group\[data-layout="strip"\]\s*\{[\s\S]*?--strip-height:\s*var\(--portfolio-strip-height\);/,
  );
  assert.match(
    components,
    /@container media-group \(width > 48rem\)\s*\{[\s\S]*?\.portfolio-showcase__group\[data-layout="strip"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?--strip-justify:\s*flex-start;/,
  );
  assert.doesNotMatch(media, /portfolio-showcase/);
});
