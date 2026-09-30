import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const template = readFileSync(new URL("../src/templates/jestei-theme-organism.ts", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/components/jestei-theme-organism/jestei-theme-organism.css", import.meta.url), "utf8");

test("Jestei theme card track delegates peer wrapping to cluster", () => {
  assert.match(template, /class="jestei-theme-organism__track cluster"/);
  assert.match(css, /\.jestei-theme-organism__track\s*\{[\s\S]*?--cluster-wrap:\s*wrap;[\s\S]*?--cluster-align:\s*stretch;[\s\S]*?--cluster-space:\s*1rem;/);
  assert.match(css, /\[data-motion-state="animated"\][\s\S]*?\.jestei-theme-organism__track\s*\{[\s\S]*?--cluster-wrap:\s*nowrap;[\s\S]*?--cluster-space:\s*var\(--jestei-track-gap\);/);
  assert.doesNotMatch(css, /\.jestei-theme-organism__track\s*\{[\s\S]*?display:\s*flex;/);
});
