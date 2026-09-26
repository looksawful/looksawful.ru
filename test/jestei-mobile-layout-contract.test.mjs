import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  jesteiBrandSystemGroup,
  jesteiEventGroup,
  jesteiInstagramPlayerIntro,
  jesteiInterfaceGroup,
  jesteiPromoIntro,
  jesteiPromoSequence,
} from "../src/data/content/jestei-pool.ts";

const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

test("Jestei mobile copy uses explicit portfolio-facing promo headings", () => {
  assert.equal(jesteiInstagramPlayerIntro.title, "Промо в соцсетях");
  assert.equal(jesteiPromoIntro.title, "Промо и коммуникации");
});

test("Jestei authored horizontal groups remain explicit reels", () => {
  for (const group of [jesteiBrandSystemGroup, jesteiInterfaceGroup, jesteiEventGroup]) {
    assert.equal(group.layout, "grid");
    assert.equal(group.mode, "compact-reel");
  }

  assert.equal(jesteiPromoSequence.layout, "sequence");
});

test("Jestei has a narrow-container single-column and reel preservation contract", () => {
  assert.match(
    components,
    /@container project \(width <= 50rem\)[\s\S]*?#project-jestei[\s\S]*?\.section-copy[\s\S]*?--text-pair-side-size:\s*100%;[\s\S]*?--text-pair-content-min:\s*100%;/,
  );

  assert.match(
    components,
    /#project-jestei[\s\S]*?\.media-group\[data-layout="grid"\]:not\(\[data-compact-layout="reel"\]\):not\(\[data-overflow="reel"\]\)[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/,
  );

  assert.match(
    components,
    /#project-jestei[\s\S]*?data-compact-layout="reel"[\s\S]*?data-layout="sequence"[\s\S]*?>\s*\.media-group__items\.reel[\s\S]*?--reel-display:\s*flex;[\s\S]*?--reel-wrap:\s*nowrap;[\s\S]*?--reel-overflow-x:\s*auto;/,
  );
});
