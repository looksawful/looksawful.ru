import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const indexPath = new URL("../src/styles/index.css", import.meta.url);
const componentPath = new URL("../src/styles/site-navigation.css", import.meta.url);
const indexSource = readFileSync(indexPath, "utf8");
const componentSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

test("dedicated site navigation stylesheet is loaded after the existing component base", () => {
  const componentsImport = indexSource.indexOf('@import "./components.css" layer(components);');
  const navigationImport = indexSource.indexOf('@import "./site-navigation.css" layer(components);');

  assert.ok(componentsImport >= 0, "components stylesheet import must exist");
  assert.ok(navigationImport > componentsImport, "site navigation styles must override the legacy component base");
  assert.ok(existsSync(componentPath), "site navigation stylesheet must exist");
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
