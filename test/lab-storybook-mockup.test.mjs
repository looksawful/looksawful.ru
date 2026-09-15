import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const storyUrl = new URL("../src/lab/stories/mockup.stories.js", import.meta.url);
test("mockup molecule uses canonical renderer and homepage production data", async () => {
  const source = await readFile(storyUrl, "utf8");
  assert.match(source, /from "\.\.\/\.\.\/templates\/mockup\.ts"/);
  assert.match(source, /from "\.\.\/\.\.\/data\/content\/berry\.ts"/);
  assert.match(source, /title: "02 Molecules\/Mockup"/);
  assert.match(source, /canonical: true/);
  assert.match(source, /responsive:\s*\{/);
  assert.doesNotMatch(source, /<figure|<img|<video/);
});
test("mockup molecule resolves importable production fixtures", async () => {
  const story = await import(`${storyUrl.href}?fixture=${Date.now()}`);
  assert.equal(typeof story.default.render, "function");
  assert.ok(story.Default);
});
