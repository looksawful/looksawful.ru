import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../src/styles/index.css", import.meta.url), "utf8");

test("project cards use a restrained fine-pointer hover treatment", () => {
  assert.match(css, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/);
  assert.match(css, /\.project-card__media::after\s*\{[^}]*var\(--clr-accent\)[^}]*transition:\s*opacity/s);
  assert.match(css, /\.project-card:hover\s+\.project-card__media\s+img\s*\{[^}]*transform:\s*scale\(1\.025\)/s);
});

test("project card zoom respects reduced motion", () => {
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.project-card__media\s+img\s*\{[^}]*transition:\s*none[^}]*transform:\s*none/s,
  );
});
