import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const storyUrl = new URL("../src/lab/stories/media-lightbox.stories.js", import.meta.url);

test("Storybook exposes the production media lightbox as a canonical organism fixture", async () => {
  const story = await readFile(storyUrl, "utf8");

  assert.match(story, /createMediaLightbox/);
  assert.match(story, /renderMediaGroup/);
  assert.match(story, /sensetiqueOlovoBookletGroup/);
  assert.match(story, /layer:\s*["']organism["']/);
  assert.match(story, /policy:\s*["']behavior-fixture["']/);
  assert.match(story, /canonical:\s*true/);
  assert.match(story, /state:\s*["']closed["']/);
  assert.match(story, /visibility:\s*\[["']overlay["']\]/);
  assert.match(story, /interaction:\s*\[["']closed["'],\s*["']open["'],\s*["']focus-visible["']\]/);
  assert.match(story, /export const OverlayOpen/);
  assert.match(story, /state:\s*["']overlay-open["']/);
  assert.match(story, /export const KeyboardOpen/);
  assert.match(story, /state:\s*["']keyboard-open["']/);
  assert.match(story, /review:\s*\[["']desktop["'],\s*["']tablet["'],\s*["']mobile["']\]/);
});
