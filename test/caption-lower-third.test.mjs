import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function extractBlock(source, pattern, message) {
  const match = source.match(pattern);
  assert.ok(match?.[1], message);
  return match[1];
}

test("caption index occupies only the first grid row", async () => {
  const captions = await read("src/styles/captions.css");

  assert.match(
    captions,
    /\.media__index\s*\{[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*1;/,
  );
  assert.doesNotMatch(captions, /grid-row:\s*1\s*\/\s*span\s*32/);
});

test("desktop overlay lower-third grows intrinsically and scrolls only when content exceeds the media", async () => {
  const captions = await read("src/styles/captions.css");
  const overlay = extractBlock(
    captions,
    /\) > figcaption\.media__caption \{\n\s*--caption-index-width:\s*2\.2ch;([\s\S]*?)\n\s*\}/,
    "desktop overlay caption rule should exist",
  );

  assert.match(overlay, /inset-block-end:\s*0;/);
  assert.match(overlay, /inset-inline:\s*0;/);
  assert.match(overlay, /max-inline-size:\s*none;/);
  assert.match(overlay, /max-block-size:\s*100%;/);
  assert.match(overlay, /overflow-x:\s*hidden;/);
  assert.match(overlay, /overflow-y:\s*auto;/);
  assert.match(overlay, /background:\s*rgb\(10 10 10 \/ 0\.82\);/);
  assert.doesNotMatch(overlay, /max-block-size:\s*min\(60%,\s*18rem\)/);
  assert.doesNotMatch(overlay, /overscroll-behavior:\s*contain/);
});

test("persistent rail overlays stay out of touch geometry without being disabled on desktop", async () => {
  const styles = await read("src/styles/index.css");

  assert.match(
    styles,
    /@media \(\(hover: none\) or \(pointer: coarse\)\) \{[\s\S]*?\.media-group\[data-layout="strip"\][\s\S]*?\.media-group\[data-layout="grid"\]\[data-overflow="reel"\][\s\S]*?\.justified-gallery__row[\s\S]*?display:\s*none;/,
  );

  const captionsLayer = styles.match(/@layer captions \{([\s\S]*)\}\s*$/)?.[1] ?? "";
  const beforeTouchRule = captionsLayer.split(/@media \(\(hover: none\) or \(pointer: coarse\)\)/)[0];

  assert.doesNotMatch(
    beforeTouchRule,
    /figure\.media\[data-caption-view="overlay"\][\s\S]*?display:\s*none;/,
  );
});

test("dense compact layouts keep overlay captions out of touch geometry only while compact", async () => {
  const styles = await read("src/styles/index.css");

  assert.match(
    styles,
    /@media \(\(hover: none\) or \(pointer: coarse\)\) \{[\s\S]*?@container media-group \(width <= 42rem\) \{[\s\S]*?\.media-group\[data-layout="grid"\]\[data-compact-layout="reel"\][\s\S]*?figure\.media\[data-caption-view="overlay"\][\s\S]*?> \.media__caption[\s\S]*?display:\s*none;/,
  );

  assert.match(
    styles,
    /@container media-group \(width <= 48rem\) \{[\s\S]*?\.media-group\[data-layout="sequence"\][\s\S]*?figure\.media\[data-caption-view="overlay"\][\s\S]*?> \.media__caption,[\s\S]*?\.media-group\[data-layout="bento"\][\s\S]*?figure\.media\[data-caption-view="overlay"\][\s\S]*?> \.media__caption[\s\S]*?display:\s*none;/,
  );
});

test("custom Jestei hover copy uses intrinsic height with the full-surface safety cap", async () => {
  const captions = await read("src/styles/captions.css");
  const custom = extractBlock(
    captions,
    /\.brand-system__hover-copy,\n\s*\.jestei-captioned-group \.jestei-media__hover-copy \{([\s\S]*?)\n\s*\}/,
    "custom Jestei lower-third rule should exist",
  );

  assert.match(custom, /inset-inline:\s*0;/);
  assert.match(custom, /inset-block-end:\s*0;/);
  assert.match(custom, /max-inline-size:\s*none;/);
  assert.match(custom, /max-block-size:\s*100%;/);
  assert.match(custom, /overflow-x:\s*hidden;/);
  assert.match(custom, /overflow-y:\s*auto;/);
  assert.match(custom, /background:\s*rgb\(10 10 10 \/ 0\.82\);/);
  assert.doesNotMatch(custom, /max-block-size:\s*min\(60%,\s*18rem\)/);
});
