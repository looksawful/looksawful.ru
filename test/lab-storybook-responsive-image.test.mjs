import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const storyUrl = new URL("../src/lab/stories/responsive-image.stories.js", import.meta.url);

test("responsive image atom uses canonical production owner and real media data", async () => {
  const source = await readFile(storyUrl, "utf8");
  assert.match(source, /from "\.\.\/\.\.\/templates\/responsive-image\.ts"/);
  assert.match(source, /from "\.\.\/\.\.\/data\/media\/catalog\.ts"/);
  assert.match(source, /title: "01 Atoms\/Responsive Image"/);
  assert.match(source, /layer: "atom"/);
  assert.match(source, /policy: "isolated"/);
  assert.match(source, /canonical: true/);
  assert.match(source, /state: "lazy"/);
  assert.match(source, /responsive:\s*\{/);
  assert.doesNotMatch(source, /srcset\s*=/);
});
