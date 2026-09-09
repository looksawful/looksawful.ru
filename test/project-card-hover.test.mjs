import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../src/styles/index.css", import.meta.url), "utf8");

test("project cards use a restrained fine-pointer hover treatment", () => {
  assert.match(css, /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/);
  assert.match(css, /\.project-card__media::after\s*\{[^}]*var\(--clr-accent\)[^}]*transition:\s*opacity/s);
  assert.match(css, /\.project-card:hover\s+\.project-card__media\s+img\s*\{[^}]*transform:\s*scale\(1\.025\)/s);
});

test("project card zoom respects reduced motion with a winning hover override", () => {
  const reduceStart = css.indexOf("@media (prefers-reduced-motion: reduce)");
  assert.notEqual(reduceStart, -1, "reduced-motion media query must exist");

  const reduceCss = css.slice(reduceStart);
  assert.match(
    reduceCss,
    /\.project-card__media\s+img\s*\{[^}]*transition:\s*none/s,
  );
  assert.match(
    reduceCss,
    /\.project-card:hover\s+\.project-card__media\s+img\s*\{[^}]*transform:\s*none/s,
    "reduced motion must override the equally specific hover transform, not only the base image",
  );
});
