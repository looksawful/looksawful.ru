import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const storyUrl = new URL("../src/lab/stories/justified-gallery.stories.js", import.meta.url);

test("Storybook exposes the production justified gallery as a canonical organism fixture", async () => {
  const story = await readFile(storyUrl, "utf8");

  assert.match(story, /renderJustifiedGallery/);
  assert.match(story, /sensetiqueStudioJustifiedGallery/);
  assert.match(story, /layer:\s*["']organism["']/);
  assert.match(story, /policy:\s*["']isolated["']/);
  assert.match(story, /canonical:\s*true/);
  assert.match(story, /state:\s*["']responsive-layout["']/);
  assert.match(story, /visibility:\s*\[["']always["']\]/);
  assert.match(story, /review:\s*\[["']desktop["'],\s*["']tablet["'],\s*["']mobile["']\]/);
  assert.doesNotMatch(story, /render-fixture|reveal-contract/);
});
