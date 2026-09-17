import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const storyUrl = new URL("../src/lab/stories/media-deck.stories.js", import.meta.url);

test("Storybook exposes the production media deck as a canonical organism fixture", async () => {
  const story = await readFile(storyUrl, "utf8");

  assert.match(story, /createMediaDeck/);
  assert.match(story, /renderMediaSlider/);
  assert.match(story, /sensetiqueHarshLightSlider/);
  assert.match(story, /layer:\s*["']organism["']/);
  assert.match(story, /policy:\s*["']behavior-fixture["']/);
  assert.match(story, /canonical:\s*true/);
  assert.match(story, /state:\s*["']selected-slide["']/);
  assert.match(story, /visibility:\s*\[["']offscreen-or-virtualized["']\]/);
  assert.match(story, /interaction:\s*\[["']default["'],\s*["']selected["']\]/);
  assert.match(story, /motion:\s*\[["']motion-enabled["'],\s*["']reduced-motion["']\]/);
  assert.match(story, /review:\s*\[["']desktop["'],\s*["']tablet["'],\s*["']mobile["']\]/);
  assert.match(story, /export const NextSelected/);
  assert.match(story, /data-deck-next/);
});
