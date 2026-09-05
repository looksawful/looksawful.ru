import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const indexPath = new URL("../src/styles/index.css", import.meta.url);
const mainPath = new URL("../src/main.ts", import.meta.url);
const componentPath = new URL("../src/styles/site-navigation.css", import.meta.url);
const indexSource = readFileSync(indexPath, "utf8");
const mainSource = readFileSync(mainPath, "utf8");
const componentSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

test("dedicated navigation stylesheet stays component-owned", () => {
  assert.ok(existsSync(componentPath), "site navigation stylesheet must exist");
  assert.doesNotMatch(indexSource, /site-navigation\.css/);
  assert.match(mainSource, /import\s+["']\.\/styles\/site-navigation\.css["'];/);
});

test("site navigation uses one two-column responsive structure and minimal centered fullscreen menu", () => {
  assert.match(componentSource, /\.site-nav__bar/);
  assert.match(componentSource, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+max-content/);
  assert.doesNotMatch(componentSource, /\.site-nav__brand\b|\.site-nav__toggle-icon\b/);
  assert.match(componentSource, /\.site-nav__toggle\b[\s\S]*?min-inline-size:\s*3\.5rem/);
  assert.match(componentSource, /\.site-nav__toggle-face\b[\s\S]*?inline-size:\s*3rem/);
  assert.match(componentSource, /\.site-nav__menu\b[\s\S]*?position:\s*fixed/);
  assert.match(componentSource, /\.site-nav__menu\b[\s\S]*?display:\s*grid/);
  assert.match(componentSource, /\.site-nav__menu\b[\s\S]*?place-items:\s*center/);
  assert.match(componentSource, /\.site-nav__menu\b[\s\S]*?overflow:\s*clip/);
  assert.match(componentSource, /\.site-nav__menu-nav\b[\s\S]*?inline-size:\s*fit-content/);
  assert.match(componentSource, /\.site-nav__menu-list\b[\s\S]*?justify-items:\s*center/);
  assert.match(componentSource, /background:\s*var\(--clr-bg\)/);
  assert.doesNotMatch(componentSource, /box-shadow|backdrop-filter|border-radius/);
});

test("coarse pointer geometry and fine-pointer preview are CSS capability contracts", () => {
  assert.match(componentSource, /@media\s*\([^)]*(?:hover:\s*none|pointer:\s*coarse)/);
  assert.match(componentSource, /--site-nav-height:\s*4rem/);
  assert.match(componentSource, /min-inline-size:\s*4rem/);
  assert.match(componentSource, /\.site-nav__toggle-face\b[\s\S]*?inline-size:\s*3\.5rem/);
  assert.match(componentSource, /\.awfulface__morph-targets\b[\s\S]*?visibility:\s*hidden/);
  assert.match(componentSource, /\.menu-preview\b/);
  assert.match(componentSource, /inline-size:\s*clamp\(15rem,\s*27vi,\s*29rem\)/);
  assert.match(componentSource, /aspect-ratio:\s*790\s*\/\s*680/);
  assert.match(componentSource, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/);
  assert.match(componentSource, /@media\s*\(prefers-reduced-motion:\s*no-preference\)/);
});
