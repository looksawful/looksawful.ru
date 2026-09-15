import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const storyUrl = new URL("../src/lab/stories/resource-links.stories.js", import.meta.url);
test("resource links molecule uses canonical renderer and production editorial data", async () => {
  const source = await readFile(storyUrl, "utf8");
  assert.match(source, /from "\.\.\/\.\.\/components\/composition\/resource-links\.ts"/);
  assert.match(source, /from "\.\.\/\.\.\/data\/content\/jestei-page-presentation\.ts"/);
  assert.match(source, /title: "02 Molecules\/Resource Links"/);
  assert.match(source, /canonical: true/);
  assert.match(source, /policy: "isolated"/);
  assert.match(source, /responsive:\s*\{/);
  assert.doesNotMatch(source, /<a |<p|<div/);
});
test("resource links molecule resolves an importable production fixture", async () => {
  const story = await import(`${storyUrl.href}?fixture=${Date.now()}`);
  assert.equal(typeof story.default.render, "function");
  assert.ok(story.Default);
});
