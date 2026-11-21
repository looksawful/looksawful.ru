import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import patterns, { LayoutPrimitives, ProseVsStack, ProseSimple, TextPairSensetiqueProduction } from "../src/lab/stories/layout-patterns.stories.mjs";

test("production layout CSS patterns are visible in one read-only story", () => {
  assert.equal(patterns.title, "00 Foundations/CSS Patterns");
  assert.equal(patterns.parameters.looksawful.canonical, true);
  const html = LayoutPrimitives.render();
  const css = readFileSync(new URL("../src/styles/patterns.css", import.meta.url), "utf8");
  for (const name of ["wrapper", "stack", "cluster", "pile", "grid", "auto-grid", "split", "text-pair"]) {
    assert.match(html, new RegExp('class="[^"]*\\b' + name + '\\b'), name);
    assert.match(css, new RegExp('\\.' + name + '\\s*\\{'), name);
  }
  assert.match(html, /src\/styles\/patterns\.css/);
  assert.match(html, /evangelistic-css/);
  assert.match(ProseVsStack.render(), /class="prose"/);
  assert.match(ProseSimple.render(), /class="prose"/);
  assert.equal(typeof TextPairSensetiqueProduction.render, "function");
});
