import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const storyUrl = new URL("../src/lab/stories/media-figure.stories.js", import.meta.url);

test("media figure molecule uses canonical renderer and real production data", async () => {
  const source = await readFile(storyUrl, "utf8");
  assert.match(source, /from "\.\.\/\.\.\/templates\/media-figure\.ts"/);
  assert.match(source, /from "\.\.\/\.\.\/data\/content\/awful-cases\.ts"/);
  assert.match(source, /title: "02 Molecules\/Media Figure"/);
  assert.match(source, /layer: "molecule"/);
  assert.match(source, /canonical: true/);
  assert.match(source, /responsive:\s*\{/);
  assert.doesNotMatch(source, /<figure|<img|<video/);
});

test("media figure molecule resolves an importable production fixture", async () => {
  const story = await import(`${storyUrl.href}?fixture=${Date.now()}`);
  assert.equal(typeof story.default.render, "function");
  assert.ok(story.Default);
});
