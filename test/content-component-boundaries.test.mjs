import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const canonicalModules = [
  "media-figure",
  "media-group",
  "media-slider",
  "mockup",
  "mockup-deck",
  "justified-gallery",
  "before-after",
  "page-flip",
];

test("generic content blocks expose canonical component import boundaries", () => {
  for (const name of canonicalModules) {
    const source = readFileSync(`src/components/content/${name}.ts`, "utf8");
    assert.match(source, new RegExp(`templates/${name}\\.ts`));
  }

  const barrel = readFileSync("src/components/content/index.ts", "utf8");
  for (const name of canonicalModules) {
    assert.match(barrel, new RegExp(`\\./${name}\\.ts`));
  }
});
