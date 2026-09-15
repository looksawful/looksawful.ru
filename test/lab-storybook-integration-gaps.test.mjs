import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("project navigation reuses production Home markup and runtime", async () => {
  const story = await read("src/lab/stories/project-navigation.stories.js");
  assert.match(story, /index\.html\?raw/);
  assert.match(story, /extractElementContainingMarker/);
  assert.match(story, /src\/components\/project-navigation\.ts/);
  assert.doesNotMatch(story, /aria-label="РџСЂРѕРµРєС‚С‹"|>A<|>B</);
  assert.match(story, /"offscreen-or-virtualized"/);
  assert.match(story, /"selected"/);
  assert.match(story, /review:\s*\["desktop",\s*"tablet",\s*"mobile"\]/);
});

test("media deck uses production renderer/runtime/data and records motion states", async () => {
  const story = await read("src/lab/stories/media-deck.stories.js");
  assert.match(story, /renderMediaSlider/);
  assert.match(story, /createMediaDeck/);
  assert.match(story, /sensetiqueHarshLightSlider/);
  assert.match(story, /"selected"/);
  assert.match(story, /"offscreen-or-virtualized"/);
  assert.match(story, /"reduced-motion"/);
});

test("animated canvas gallery uses production Styx data and real state contract", async () => {
  const story = await read("src/lab/stories/animated-canvas-gallery.stories.js");
  assert.match(story, /styxProductionMockupDeck/);
  assert.match(story, /renderAnimatedCanvasGallery/);
  assert.doesNotMatch(story, /Storybook production masonry gallery/);
  assert.match(story, /state:\s*"loading"/);
  assert.match(story, /state:\s*"ready"/);
  assert.match(story, /state:\s*"error"/);
  assert.match(story, /data:\s*\["loading",\s*"ready",\s*"error"\]/);
});

test("homepage visibility uses the real legacy Home section and production removal seam", async () => {
  const story = await read("src/lab/stories/home-section-visibility.stories.js");
  assert.match(story, /index\.html\?raw/);
  assert.match(story, /applyClientLogoWallVisibility/);
  assert.match(story, /isHomeSectionVisible/);
  assert.match(story, /extractElementContainingMarker/);
  assert.doesNotMatch(story, /data-home-section=/);
  assert.match(story, /state:\s*"section-hidden"/);
  assert.match(story, /visibility:\s*\["conditional",\s*"data"\]/);
});

test("media lightbox uses production renderer and PhotoSwipe lifecycle", async () => {
  const story = await read("src/lab/stories/media-lightbox.stories.js");
  assert.match(story, /renderMediaGroup/);
  assert.match(story, /createMediaLightbox/);
  assert.match(story, /sensetiqueOlovoBookletGroup/);
  assert.match(story, /visibility:\s*\["overlay"\]/);
  assert.match(story, /interaction:\s*\[[^\]]*"closed"[^\]]*"focus-visible"/s);
  assert.match(story, /state:\s*"overlay-open"/);
});
