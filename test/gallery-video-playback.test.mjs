import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const playbackSource = await readFile(
  new URL("../src/components/gallery/gallery-video-playback.ts", import.meta.url),
  "utf8",
).catch(() => "");

test("Gallery wall video autoplay policy respects visibility and reduced motion", async () => {
  const module = await import("../src/components/gallery/gallery-video-playback.ts");
  assert.equal(module.galleryVideoShouldAutoplay(false, 0.75), true);
  assert.equal(module.galleryVideoShouldAutoplay(false, 0.6), true);
  assert.equal(module.galleryVideoShouldAutoplay(false, 0.25), false);
  assert.equal(module.galleryVideoShouldAutoplay(true, 1), false);
});

test("Gallery wall video controller owns one observer and deterministic cleanup", () => {
  assert.match(playbackSource, /IntersectionObserver/);
  assert.match(playbackSource, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(playbackSource, /threshold:\s*\[?0\.6/);
  assert.match(playbackSource, /video\.pause\(\)/);
  assert.match(playbackSource, /video\.play\(\)\.catch/);
  assert.match(playbackSource, /observer\.disconnect\(\)/);
  assert.match(playbackSource, /removeEventListener\("change"/);
});
