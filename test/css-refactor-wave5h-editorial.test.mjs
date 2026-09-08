import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fastTests } from "../tools/ci/run-tests.mjs";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

const editorialPatterns = [
  [/\/\* Explicit editorial grid\. Item spans are local custom properties\. \*\//, "editorial marker"],
  [/(?:^|\n)\.media-group\[data-layout="editorial"\]\s*>\s*\.media-group__items\s*\{/, "editorial items owner"],
];

test("Wave5H editorial family has one canonical media owner", () => {
  for (const [pattern, label] of editorialPatterns) {
    assert.match(media, pattern, `media.css must own ${label}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${label}`);
  }
});

test("Wave5H preserves authored editorial placement inputs and responsive grid geometry", () => {
  assert.match(
    media,
    /\.media-group\[data-layout="editorial"\]\s*>\s*\.media-group__items\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?column-gap:\s*var\(--group-gap\);[\s\S]*?row-gap:\s*var\(--group-row-gap\);/,
  );
  assert.match(
    media,
    /grid-column:\s*var\(--start,\s*auto\)\s*\/\s*span\s+var\(--span,\s*4\);/,
  );
  assert.match(
    media,
    /@container media-group \(width > 48rem\)[\s\S]*?grid-column:\s*var\(--start,\s*auto\)\s*\/\s*span\s+var\(--span,\s*8\);/,
  );
});

test("Wave5H keeps editorial authored inputs in the renderer rather than inventing CSS writers", () => {
  const figure = readFileSync(new URL("../src/templates/media-figure.ts", import.meta.url), "utf8");

  assert.match(figure, /variables\.push\(`--start: \$\{placement\.start\}`\)/);
  assert.match(figure, /variables\.push\(`--span: \$\{placement\.span\}`\)/);
  assert.doesNotMatch(media, /--start\s*:/);
  assert.doesNotMatch(media, /--span\s*:/);
});

test("Wave5H stops before masonry, bento and infinite-reel ownership", () => {
  for (const pattern of [
    /(?:^|\n)\.media-group\[data-layout="masonry"\]/,
    /(?:^|\n)\.media-group\[data-layout="bento"\]/,
    /(?:^|\n)\[data-infinite-reel\]\s*\{/,
  ]) {
    assert.doesNotMatch(media, pattern, `media.css must not absorb later family ${pattern}`);
    assert.match(components, pattern, `components.css must retain later family ${pattern}`);
  }
});

test("Wave5H follows the accepted strip family in media source order", () => {
  const strip = media.indexOf("Equal-height media strip");
  const editorial = media.indexOf("Explicit editorial grid");
  assert.notEqual(strip, -1);
  assert.notEqual(editorial, -1);
  assert.ok(strip < editorial, "editorial must follow the accepted strip family");
});

test("Wave5H editorial ownership contract is mandatory in Fast CI", () => {
  assert.equal(fastTests.has("test/css-refactor-wave5h-editorial.test.mjs"), true);
});
