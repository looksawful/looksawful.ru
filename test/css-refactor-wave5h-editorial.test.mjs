import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");

const editorialPatterns = [
  [/(?:^|\n)\.media-group\[data-layout="editorial"\]\s*>\s*\.media-group__items\s*\{/, "editorial items owner"],
];

test("editorial family has one canonical media owner", () => {
  for (const [pattern, label] of editorialPatterns) {
    assert.match(media, pattern, `media.css must own ${label}`);
    assert.doesNotMatch(components, pattern, `components.css must no longer own ${label}`);
  }
});

test("editorial preserves authored placement inputs and responsive grid geometry", () => {
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

test("editorial authored inputs stay in the renderer rather than CSS writers", () => {
  const figure = readFileSync(new URL("../src/templates/media-figure.ts", import.meta.url), "utf8");

  assert.match(figure, /variables\.push\(`--start: \$\{placement\.start\}`\)/);
  assert.match(figure, /variables\.push\(`--span: \$\{placement\.span\}`\)/);
  assert.doesNotMatch(media, /--start\s*:/);
  assert.doesNotMatch(media, /--span\s*:/);
});
