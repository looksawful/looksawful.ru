import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const mainPath = new URL("../src/main.ts", import.meta.url);
const componentPath = new URL("../src/components/site-navigation.ts", import.meta.url);
const mainSource = readFileSync(mainPath, "utf8");
const componentSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

test("site navigation runtime is isolated and mounted into the main destroy lifecycle", () => {
  assert.match(
    mainSource,
    /import\s*\{\s*initSiteNavigation\s*\}\s*from\s*["']\.\/components\/site-navigation\.ts["']/,
  );
  assert.match(mainSource, /destroys\.push\(initSiteNavigation\(document\)\)/);
  assert.ok(existsSync(componentPath), "site navigation component must exist");
  assert.match(componentSource, /export function initSiteNavigation/);
});

test("site navigation runtime owns toggle, Escape, focus return, link close and scroll cleanup", () => {
  assert.match(componentSource, /aria-expanded/);
  assert.match(componentSource, /event\.key === ["']Escape["']/);
  assert.match(componentSource, /toggle\.focus\(\)/);
  assert.match(componentSource, /closest\(["']a\[href\]["']\)/);
  assert.match(componentSource, /body\.style\.overflow/);
  assert.match(componentSource, /removeEventListener/);
});
