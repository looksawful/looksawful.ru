import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

test("paired code blocks use the intrinsic split primitive", () => {
  const splitPairs = index.match(/class="split code-block-grid"/g) ?? [];
  assert.equal(splitPairs.length, 2);
  assert.doesNotMatch(index, /class="grid(?: code-block-grid)?" style="--grid-columns: repeat\(2, minmax\(0, 1fr\)\)"/);
  assert.doesNotMatch(index, /--group-columns:\s*2;\s*--group-mobile-columns:\s*2/);
});

test("code-block layout no longer needs a container-query column override", () => {
  assert.doesNotMatch(components, /\.project__section \.code-block-grid,[\s\S]*?--grid-columns:/);
  assert.doesNotMatch(components, /\.project__section > \.grid[\s\S]*?--grid-columns:/);
});
