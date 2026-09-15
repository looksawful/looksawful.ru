import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const storyUrl = new URL("../src/lab/stories/subproject-card.stories.js", import.meta.url);
test("subproject card molecule uses canonical renderer and production card data", async () => {
  const source = await readFile(storyUrl, "utf8");
  assert.match(source, /from "\.\.\/\.\.\/templates\/subproject-card\.ts"/);
  assert.match(source, /from "\.\.\/\.\.\/data\/subproject-cards\.ts"/);
  assert.match(source, /title: "02 Molecules\/Subproject Card"/);
  assert.match(source, /canonical: true/);
  assert.match(source, /responsive:\s*\{/);
  assert.doesNotMatch(source, /<article|<img|<a /);
});
test("subproject card molecule resolves an importable production fixture", async () => {
  const story = await import(`${storyUrl.href}?fixture=${Date.now()}`);
  assert.equal(typeof story.default.render, "function");
  assert.ok(story.Default);
});
