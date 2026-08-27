import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("desktop overlay caption is a full-width lower-third with controlled contrast", async () => {
  const captions = await read("src/styles/captions.css");

  assert.match(
    captions,
    /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?> figcaption\.media__caption \{[\s\S]*?--caption-index-width:\s*2\.2ch;[\s\S]*?inset-block-end:\s*0;[\s\S]*?inset-inline:\s*0;[\s\S]*?max-inline-size:\s*none;[\s\S]*?padding:[^;]+;[\s\S]*?border-block-start:\s*1px solid rgb\(255 255 255 \/ 0\.16\);[\s\S]*?background:\s*rgb\(10 10 10 \/ 0\.82\);[\s\S]*?backdrop-filter:\s*blur\(6px\);[\s\S]*?font-size:\s*clamp\(0\.82rem,[^;]+0\.95rem\);[\s\S]*?text-shadow:\s*none;/,
  );
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

test("custom Jestei hover copy uses the same lower-third surface from the caption layer", async () => {
  const captions = await read("src/styles/captions.css");

  assert.match(
    captions,
    /\.brand-system__hover-copy,[\s\S]*?\.jestei-captioned-group \.jestei-media__hover-copy \{[\s\S]*?inset-inline:\s*0;[\s\S]*?inset-block-end:\s*0;[\s\S]*?max-inline-size:\s*none;[\s\S]*?padding:[^;]+;[\s\S]*?border-block-start:\s*1px solid rgb\(255 255 255 \/ 0\.16\);[\s\S]*?background:\s*rgb\(10 10 10 \/ 0\.82\);[\s\S]*?backdrop-filter:\s*blur\(6px\);[\s\S]*?color:\s*#fff;[\s\S]*?text-shadow:\s*none;/,
  );
});
