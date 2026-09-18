import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const primitivesUrl = new URL("../src/styles/primitives.css", import.meta.url);
const indexCss = readFileSync(new URL("../src/styles/index.css", import.meta.url), "utf8");

test("shared UI primitives have one canonical stylesheet owner", () => {
  assert.equal(existsSync(primitivesUrl), true, "src/styles/primitives.css must exist");
  const marker = '@import "./primitives.css" layer(components);';
  assert.equal(indexCss.split(marker).length - 1, 1);
});

test("primitive stylesheet exposes the small public UI contract", () => {
  assert.equal(existsSync(primitivesUrl), true, "src/styles/primitives.css must exist");
  const css = readFileSync(primitivesUrl, "utf8");
  for (const selector of [".control", ".chip", ".badge", ".panel"]) {
    assert.ok(css.includes(selector), "missing " + selector);
  }
  assert.match(css, /\[data-variant="primary"\]/);
  assert.match(css, /\[data-size="sm"\]/);
  assert.match(css, /\[data-shape="round"\]/);
  assert.match(css, /\[data-level="raised"\]/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /:disabled/);
  assert.match(css, /\[aria-disabled="true"\]/);
  assert.match(css, /\[aria-pressed="true"\]/);
});

test("shared primitives consume canonical tokens instead of literal colors", () => {
  assert.equal(existsSync(primitivesUrl), true, "src/styles/primitives.css must exist");
  const css = readFileSync(primitivesUrl, "utf8");
  assert.match(css, /var\(--clr-accent\)/);
  assert.match(css, /var\(--clr-text\)/);
  assert.match(css, /var\(--clr-border\)/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(css, /\brgba?\(/i);
  assert.doesNotMatch(css, /\bhsla?\(/i);
  assert.doesNotMatch(css, /\boklch\(/i);
});
