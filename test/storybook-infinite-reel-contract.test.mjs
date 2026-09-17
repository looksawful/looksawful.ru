import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const storyUrl = new URL("../src/lab/stories/infinite-reel.stories.js", import.meta.url);

test("Storybook exposes the production infinite reel as a canonical organism fixture", async () => {
  const story = await readFile(storyUrl, "utf8");

  assert.match(story, /createInfiniteReel/);
  assert.match(story, /renderMediaGroup/);
  assert.match(story, /jesteiInstagramPlayerStrip/);
  assert.match(story, /layer:\s*["']organism["']/);
  assert.match(story, /policy:\s*["']behavior-fixture["']/);
  assert.match(story, /canonical:\s*true/);
  assert.match(story, /state:\s*["']runtime-ready["']/);
  assert.match(story, /visibility:\s*\[["']offscreen-or-virtualized["']\]/);
  assert.match(story, /motion:\s*\[["']motion-enabled["'],\s*["']reduced-motion["']\]/);
  assert.match(story, /review:\s*\[["']desktop["'],\s*["']tablet["'],\s*["']mobile["']\]/);
});
