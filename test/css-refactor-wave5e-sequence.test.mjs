import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

const sequencePatterns = [
  [/(?:^|\n)\.media-group\[data-layout="sequence"\]\s*\{/, "sequence family"],
  [/(?:^|\n)\.media-group__middle\s*\{/, "sequence middle owner"],
  [/(?:^|\n)\.media-group\[data-layout="sequence"\]\s*>\s*\.media-group__items\s*>\s*\.media-group__middle\s*\{/, "sequence middle integration"],
  [/@container media-group \(width > 48rem\)[\s\S]*?\.media-group\[data-layout="sequence"\]/, "sequence wide-container transition"],
];

test("sequence family has one canonical media owner", () => {
  for (const [pattern, label] of sequencePatterns) {
    assert.match(media, pattern, `media.css must own ${label}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${label}`);
  }
});

test("sequence keeps authored configuration and intrinsic geometry contract", () => {
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
