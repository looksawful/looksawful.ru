import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("project card records its real keyboard focus and responsive evidence", async () => {
  const story = await read("src/lab/stories/project-card.stories.js");

  assert.match(story, /interaction:\s*\[[^\]]*"default"[^\]]*"focus-visible"/s);
  assert.match(story, /review:\s*\["desktop",\s*"tablet",\s*"mobile"\]/);
  assert.match(story, /export const FocusVisible/);
  assert.match(story, /state:\s*"focus-visible"/);
});

test("page flip records real control, orientation and motion axes", async () => {
  const story = await read("src/lab/stories/page-flip.stories.js");

  assert.match(story, /interaction:\s*\[[^\]]*"default"[^\]]*"active-or-pressed"[^\]]*"disabled"/s);
  assert.match(story, /conditions:\s*\[[^\]]*"portrait"[^\]]*"landscape"/s);
  assert.match(story, /motion:\s*\["motion-enabled",\s*"reduced-motion"\]/);
});

test("code block and before-after expose only production-backed state variants", async () => {
  const codeBlock = await read("src/lab/stories/code-block.stories.js");
  const beforeAfter = await read("src/lab/stories/before-after.stories.js");

  assert.match(codeBlock, /export const FocusVisible/);
  assert.match(codeBlock, /export const Copied/);
  assert.match(codeBlock, /state:\s*"copied-confirmation"/);
  assert.match(beforeAfter, /export const ManualAdjusted/);
  assert.match(beforeAfter, /state:\s*"manual-adjusted"/);
  assert.match(beforeAfter, /state:\s*"auto-reveal"/);
  assert.match(beforeAfter, /motion:\s*\["motion-enabled",\s*"reduced-motion"\]/);
});