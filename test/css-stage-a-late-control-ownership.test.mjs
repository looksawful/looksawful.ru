import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexCss = readFileSync(new URL("../src/styles/index.css", import.meta.url), "utf8");
const sliderCss = readFileSync(new URL("../src/styles/slider.css", import.meta.url), "utf8");
const pageFlipCss = readFileSync(new URL("../src/styles/page-flip.css", import.meta.url), "utf8");

test("Stage A keeps slider control typography in the slider owner", () => {
  const ownerRule = sliderCss.match(/\.slider-controls\s*\{[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(ownerRule, /font-size:\s*var\(--fs-200\);/);
  assert.match(ownerRule, /line-height:\s*var\(--lh-heading\);/);
  assert.doesNotMatch(indexCss, /\.slider-controls\s*,/);
});

test("Stage A keeps page-flip counter typography in the page-flip owner", () => {
  const indexRule = pageFlipCss.match(/\.page-flip__index\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  const countRule = pageFlipCss.match(/\.page-flip__count\s*\{[\s\S]*?\n\}/)?.[0] ?? "";

  assert.match(indexRule, /font-size:\s*var\(--fs-200\);/);
  assert.match(indexRule, /line-height:\s*var\(--lh-heading\);/);
  assert.match(countRule, /font-size:\s*var\(--fs-200\);/);
  assert.match(countRule, /line-height:\s*var\(--lh-heading\);/);
  assert.doesNotMatch(indexCss, /\.page-flip__index\s*,/);
  assert.doesNotMatch(indexCss, /\.page-flip__count\s*\{/);
});
