import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const mainPath = new URL("../src/main.ts", import.meta.url);
const componentPath = new URL("../src/components/site-navigation.ts", import.meta.url);
const mainSource = readFileSync(mainPath, "utf8");
const componentSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

test("site navigation reuses the shared motion controller in the main destroy lifecycle", () => {
  assert.match(
    mainSource,
    /import\s*\{\s*initSiteNavigation\s*\}\s*from\s*["']\.\/components\/site-navigation\.ts["']/,
  );
  assert.match(mainSource, /const\s+motion\s*=\s*createMotionPreference\(\)/);
  assert.match(mainSource, /initSiteNavigation\(document,\s*motion\)/);
  assert.ok(existsSync(componentPath), "site navigation component must exist");
  assert.match(componentSource, /export function initSiteNavigation/);
  assert.doesNotMatch(componentSource, /createMotionPreference\s*\(/);
});

test("site navigation core owns toggle, inert state, Escape, focus return, link close and cleanup", () => {
  assert.match(componentSource, /aria-expanded/);
  assert.match(componentSource, /event\.key === ["']Escape["']/);
  assert.match(componentSource, /toggle\.focus\(\)/);
  assert.match(componentSource, /closest\(["']a\[href\]["']\)/);
  assert.match(componentSource, /body\.style\.overflow/);
  assert.match(componentSource, /\.inert\s*=/);
  assert.match(componentSource, /removeEventListener/);
});

test("Awfulface and preview are progressive fine-pointer enhancements with reduced-motion support", () => {
  assert.match(componentSource, /from\s+["']gsap["']/);
  assert.match(componentSource, /from\s+["']gsap\/MorphSVGPlugin["']/);
  assert.match(componentSource, /\(hover:\s*hover\) and \(pointer:\s*fine\)/);
  assert.match(componentSource, /data-awfulface-face-upper/);
  assert.match(componentSource, /data-awfulface-target/);
  assert.match(componentSource, /data-menu-preview/);
  assert.match(componentSource, /requestAnimationFrame/);
  assert.match(componentSource, /cancelAnimationFrame/);
  assert.match(componentSource, /allowsMotion|isReduced|subscribe/);
});
