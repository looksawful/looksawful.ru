import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("MediaLightbox shell root and backdrop have one canonical owner", async () => {
  const [lightbox, captions] = await Promise.all([
    read("src/styles/media-lightbox.css"),
    read("src/styles/captions.css"),
  ]);

  assert.match(
    lightbox,
    /\.media-lightbox\s*\{[\s\S]*?background:\s*rgb\(10 10 10 \/ 0\.98\)/,
  );
  assert.match(
    lightbox,
    /&::backdrop\s*\{[\s\S]*?background:\s*rgb\(0 0 0 \/ 0\.92\)[\s\S]*?backdrop-filter:\s*blur\(2px\)/,
  );
  assert.doesNotMatch(captions, /(?:^|\n)\.media-lightbox\s*\{/);
  assert.doesNotMatch(captions, /(?:^|\n)\.media-lightbox::backdrop\s*\{/);
  assert.match(captions, /(?:^|\n)\.media-lightbox__caption\s*\{/);
});
