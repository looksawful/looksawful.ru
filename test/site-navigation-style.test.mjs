import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const indexPath = new URL("../src/styles/index.css", import.meta.url);
const mainPath = new URL("../src/main.js", import.meta.url);
const componentPath = new URL("../src/styles/site-navigation.css", import.meta.url);
const indexSource = readFileSync(indexPath, "utf8");
const mainSource = readFileSync(mainPath, "utf8");
const componentSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

test("dedicated navigation stylesheet loads as component-owned CSS without changing the protected stylesheet entrypoint", () => {
  assert.ok(existsSync(componentPath), "site navigation stylesheet must exist");
  assert.doesNotMatch(indexSource, /site-navigation\.css/);
  assert.match(mainSource, /import\s+["']\.\/styles\/site-navigation\.css["'];/);
});

test("site navigation CSS keeps one responsive structure and the minimal full-viewport menu", () => {
  assert.match(componentSource, /\.site-nav__bar/);
  assert.match(componentSource, /grid-template-columns:\s*max-content\s+minmax\(0,\s*1fr\)\s+max-content/);
  assert.match(componentSource, /\.site-nav__toggle/);
  assert.match(componentSource, /min-inline-size:\s*2\.75rem/);
  assert.match(componentSource, /min-block-size:\s*2\.75rem/);
  assert.match(componentSource, /\.site-nav__menu/);
  assert.match(componentSource, /position:\s*fixed/);
  assert.match(componentSource, /background:\s*var\(--clr-bg\)/);
  assert.doesNotMatch(componentSource, /box-shadow|backdrop-filter|border-radius/);
});
