import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const masonrySource = await readFile(
  new URL("../src/components/gallery/gallery-masonry.ts", import.meta.url),
  "utf8",
).catch(() => "");

test("Gallery masonry resolves 5/4/3/2 columns", async () => {
  const module = await import("../src/components/gallery/gallery-masonry.ts");
  assert.equal(module.galleryColumnCount(1601), 5);
  assert.equal(module.galleryColumnCount(1200), 4);
  assert.equal(module.galleryColumnCount(900), 3);
  assert.equal(module.galleryColumnCount(600), 2);
});

test("Gallery masonry gives InfiniteGrid sole geometry ownership with equal gaps", () => {
  assert.match(masonrySource, /MasonryInfiniteGrid/);
  assert.match(masonrySource, /gap:\s*\{\s*horizontal:\s*gap,\s*vertical:\s*gap\s*\}/s);
  assert.match(
    masonrySource,
    /align:\s*["']stretch["']/,
    "SSR Gallery cards begin at width:100%; Masonry must stretch them to the computed column width instead of positioning full-width cards side-by-side",
  );
  assert.match(masonrySource, /renderItems\(\)/);
  assert.match(masonrySource, /updateItems\(\)/);
  assert.match(masonrySource, /ResizeObserver/);
  assert.match(masonrySource, /resizeObserver\.disconnect\(\)/);
  assert.match(masonrySource, /masonry\.destroy\(\)/);
  assert.doesNotMatch(masonrySource, /\.groupManager|\.containerManager|\._[A-Za-z]/);
});
