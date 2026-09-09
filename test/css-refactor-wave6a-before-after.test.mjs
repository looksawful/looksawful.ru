import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const beforeAfterSelectors = [
  ".before-after {",
  ".before-after__viewport {",
  ".before-after__image {",
  ".before-after__base {",
  ".before-after__reveal {",
  ".before-after__separator {",
  ".before-after__handle {",
  ".before-after__label {",
  ".before-after__label--before {",
  ".before-after__label--after {",
  ".before-after__range {",
  ".before-after__viewport:has(.before-after__range:focus-visible) {",
  ".before-after > .media__caption {",
];

test("Wave6A before-after styles have one canonical owner", async () => {
  const [indexCss, componentsCss, ownerCss] = await Promise.all([
    read("src/styles/index.css"),
    read("src/styles/components.css"),
    read("src/styles/before-after.css"),
  ]);

  assert.equal(
    (indexCss.match(/@import "\.\/before-after\.css" layer\(components\);/g) ?? []).length,
    1,
    "index.css must import before-after.css exactly once in layer(components)",
  );

  for (const selector of beforeAfterSelectors) {
    assert.ok(ownerCss.includes(selector), `before-after.css must own ${selector}`);
    assert.ok(!componentsCss.includes(selector), `components.css must stop owning ${selector}`);
  }

  assert.match(ownerCss, /--before-after-split:\s*50%/);
  assert.match(ownerCss, /--before-after-ratio:\s*16 \/ 9/);
  assert.match(ownerCss, /touch-action:\s*pan-y/);
  assert.match(ownerCss, /object-fit:\s*var\(--before-after-fit, contain\)/);
  assert.match(
    ownerCss,
    /clip-path:\s*inset\(0 calc\(100% - var\(--before-after-split\)\) 0 0\)/,
  );
  assert.match(ownerCss, /outline:\s*2px solid currentColor/);
  assert.match(ownerCss, /margin-block-start:\s*var\(--project-caption-gap\)/);
  assert.ok(!ownerCss.includes("!important"), "Wave6A must not introduce !important");
});

test("Wave6A preserves captions, runtime and lightbox boundaries", async () => {
  const [captionsCss, runtimeTs, templateTs, lightboxTs] = await Promise.all([
    read("src/styles/captions.css"),
    read("src/components/before-after.ts"),
    read("src/templates/before-after.ts"),
    read("src/components/media-lightbox.ts"),
  ]);

  assert.match(captionsCss, /figure\.before-after/);
  assert.match(runtimeTs, /\.before-after__range/);
  assert.match(templateTs, /data-before-after/);
  assert.match(lightboxTs, /\.before-after/);
});
