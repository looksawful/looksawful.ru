import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const story = readFileSync(new URL("../src/lab/stories/foundations.stories.js", import.meta.url), "utf8");

test("Foundations keeps canonical CSSOM as the only token source", () => {
  assert.match(story, /document\.styleSheets/);
  assert.match(story, /getPropertyValue/);
  assert.doesNotMatch(story, /const\s+tokens\s*=\s*\[/);
});

test("Foundations exposes dedicated visual token stories", () => {
  for (const storyName of [
    "Overview",
    "Colors",
    "Typography",
    "Spacing",
    "Radii",
    "Shadows",
    "Motion",
    "Layout",
    "Inspector",
  ]) {
    assert.match(story, new RegExp(`export const ${storyName}\\b`));
  }
});

test("token visualization resolves aliases and renders typed previews", () => {
  assert.match(story, /resolveTokenValue/);
  assert.match(story, /getComputedStyle/);
  assert.match(story, /renderColorPreview/);
  assert.match(story, /renderLengthPreview/);
  assert.match(story, /renderRadiusPreview/);
  assert.match(story, /renderShadowPreview/);
  assert.match(story, /renderTypographyPreview/);
  assert.match(story, /renderMotionPreview/);
});

test("token inspector exposes raw and resolved values", () => {
  assert.match(story, /Raw value/);
  assert.match(story, /Resolved value/);
  assert.match(story, /data-token-name/);
});
