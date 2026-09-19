import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../src/styles/project-shell.css", import.meta.url), "utf8");

test("project title measure belongs to text titles, not logo titles", () => {
  const base = css.match(/\.project__title\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.doesNotMatch(base, /max-inline-size:\s*16ch/);
  assert.match(css, /\.project__title--text\s*\{[\s\S]*?max-inline-size:\s*16ch;/);
  assert.match(css, /\.project__title--logo\s*\{[\s\S]*?max-inline-size:\s*none;/);
  assert.match(css, /\.project__title\s*\{[\s\S]*?&\s*>\s*img\s*\{[\s\S]*?max-inline-size:\s*100%;/);
});
