import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("project navigation story uses the production runtime and records docked/selected evidence", async () => {
  const story = await read("src/lab/stories/project-navigation.stories.js");
  assert.match(story, /src\/components\/project-navigation\.ts/);
  assert.match(story, /data-project-nav-docked/);
  assert.match(story, /"offscreen-or-virtualized"/);
  assert.match(story, /"selected"/);
  assert.match(story, /review:\s*\["desktop",\s*"tablet",\s*"mobile"\]/);
});

test("media deck story uses the production renderer/runtime and records selection, viewport and motion states", async () => {
  const story = await read("src/lab/stories/media-deck.stories.js");
  assert.match(story, /renderMediaSlider/);
  assert.match(story, /createMediaDeck/);
  assert.match(story, /"selected"/);
  assert.match(story, /"offscreen-or-virtualized"/);
  assert.match(story, /"reduced-motion"/);
});

test("animated canvas gallery story records production loading, ready and error states", async () => {
  const story = await read("src/lab/stories/animated-canvas-gallery.stories.js");
  assert.match(story, /renderAnimatedCanvasGallery/);
  assert.match(story, /state:\s*"loading"/);
  assert.match(story, /state:\s*"ready"/);
  assert.match(story, /state:\s*"error"/);
  assert.match(story, /data:\s*\["loading",\s*"ready",\s*"error"\]/);
});

test("homepage visibility evidence comes from authored visibility content and parser", async () => {
  const story = await read("src/lab/stories/home-section-visibility.stories.js");
  assert.match(story, /home\.json/);
  assert.match(story, /parseSectionVisibility/);
  assert.match(story, /state:\s*"section-hidden"/);
  assert.match(story, /visibility:\s*\["conditional",\s*"data"\]/);
});
