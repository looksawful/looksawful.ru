import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fastTests } from "../tools/ci/run-tests.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const ownerUrl = new URL("../src/styles/before-after.css", import.meta.url);
const owner = existsSync(ownerUrl) ? readFileSync(ownerUrl, "utf8") : "";
const components = read("../src/styles/components.css");
const index = read("../src/styles/index.css");
const captions = read("../src/styles/captions.css");
const runtime = read("../src/components/before-after.ts");
const template = read("../src/templates/before-after.ts");
const lightbox = read("../src/components/media-lightbox.ts");

const selectors = [
  /(?:^|\n)\.before-after\s*\{/,
  /(?:^|\n)\.before-after__viewport\s*\{/,
  /(?:^|\n)\.before-after__image\s*\{/,
  /(?:^|\n)\.before-after__base\s*\{/,
  /(?:^|\n)\.before-after__reveal\s*\{/,
  /(?:^|\n)\.before-after__separator\s*\{/,
  /(?:^|\n)\.before-after__handle\s*\{/,
  /(?:^|\n)\.before-after__label\s*\{/,
  /(?:^|\n)\.before-after__label--before\s*\{/,
  /(?:^|\n)\.before-after__label--after\s*\{/,
  /(?:^|\n)\.before-after__range\s*\{/,
  /(?:^|\n)\.before-after__viewport:has\(\.before-after__range:focus-visible\)\s*\{/,
  /(?:^|\n)\.before-after\s*>\s*\.media__caption\s*\{/,
];

test("Wave6A before-after has one canonical component style owner", () => {
  assert.notEqual(owner.trim(), "", "src/styles/before-after.css must exist and own the family");
  for (const selector of selectors) {
    assert.match(owner, selector, `before-after.css must own ${selector}`);
    assert.doesNotMatch(components, selector, `components.css must no longer own ${selector}`);
  }
});

test("Wave6A before-after owner is imported once in stable components-layer order", () => {
  const imports = index.match(/@import\s+["']\.\/before-after\.css["']\s+layer\(components\);/g) ?? [];
  assert.equal(imports.length, 1, "index.css must import before-after.css exactly once in layer(components)");
  assert.match(
    index,
    /@import "\.\/components\.css" layer\(components\);\n@import "\.\/before-after\.css" layer\(components\);\n@import "\.\/code-block\.css" layer\(components\);/,
    "before-after owner must keep its explicit position directly after the aggregate component owner",
  );
});

test("Wave6A preserves before-after geometry, touch, focus and reveal inputs", () => {
  for (const pattern of [
    /--before-after-split:\s*50%;/,
    /--before-after-ratio:\s*16\s*\/\s*9;/,
    /touch-action:\s*pan-y;/,
    /object-fit:\s*var\(--before-after-fit,\s*contain\);/,
    /clip-path:\s*inset\(0\s+calc\(100%\s*-\s*var\(--before-after-split\)\)\s+0\s+0\);/,
    /outline:\s*2px\s+solid\s+currentColor;/,
    /margin-block-start:\s*var\(--project-caption-gap\);/,
  ]) {
    assert.match(owner, pattern);
  }
  assert.doesNotMatch(owner, /!important/, "move-only extraction must not add specificity compensation");
});

test("Wave6A keeps caption and lightbox boundaries outside the component owner", () => {
  assert.match(captions, /figure\.before-after/);
  assert.match(lightbox, /EXCLUDED_SELECTOR\s*=\s*["'][^"']*\.before-after/);
  assert.doesNotMatch(owner, /data-caption-view|media__text|media__meta/);
});

test("Wave6A keeps runtime and template contracts unchanged", () => {
  assert.match(runtime, /--before-after-split/);
  assert.match(runtime, /addEventListener\("pointerdown"/);
  assert.match(runtime, /addEventListener\("keydown"/);
  assert.match(runtime, /addEventListener\("input"/);
  assert.match(template, /data-before-after/);
  assert.match(template, /class="before-after__range"/);
  assert.match(template, /type="range"/);
});

test("Wave6A before-after ownership contract is mandatory in Fast CI", () => {
  assert.equal(fastTests.has("test/css-refactor-wave6a-before-after.test.mjs"), true);
});
