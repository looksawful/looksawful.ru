import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const storyPath = new URL("../src/lab/stories/foundations.stories.js", import.meta.url);
const story = fs.readFileSync(storyPath, "utf8");

test("Foundations declares canonical production stylesheet ownership and responsive evidence", () => {
  for (const source of ["src/styles/index.css", "src/styles/tokens.css", "src/styles/colors.css", "src/styles/motion.css"]) {
    assert.match(story, new RegExp(source.replaceAll("/", "\\/")));
  }
  assert.match(story, /layer:\s*["']foundation["']/);
  assert.match(story, /canonical:\s*true/);
  assert.match(story, /review:\s*\[["']desktop["'],\s*["']tablet["'],\s*["']mobile["']\]/);
});

test("Foundations exposes production-derived system groups without hard-coded token values", () => {
  for (const exportName of ["Colors", "Typography", "SizingAndSpacing", "Radii", "Surfaces", "Gradients", "Motion", "ReducedMotion", "Inspector"]) {
    assert.match(story, new RegExp(`export const ${exportName}\\b`));
  }
  assert.doesNotMatch(story, /#[0-9a-f]{3,8}\b/i);
  assert.doesNotMatch(story, /rgb\([^)]*\)/i);
});

test("Foundations delegates CSSOM extraction to a focused support module", () => {
  assert.match(story, /storybook-support\/foundation-tokens\.js/);
});
