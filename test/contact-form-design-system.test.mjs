import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { fastTests } from "../tools/ci/run-tests.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("contact form uses canonical control tokens and elevated surface treatment", async () => {
  const [tokens, css] = await Promise.all([
    read("src/styles/tokens.css"),
    read("src/styles/contact-form-hub.css"),
  ]);
  assert.match(tokens, /--control-block-size:/);
  assert.match(tokens, /--control-radius:/);
  assert.match(tokens, /--shadow-control:/);
  assert.match(css, /box-shadow:\s*var\(--shadow-surface-elevated\)/);
  assert.match(css, /border-radius:\s*var\(--control-radius\)/);
  assert.match(css, /min-block-size:\s*var\(--control-block-size\)/);
  assert.match(css, /background:\s*var\(--clr-foreground\)/);
});

test("Storybook exposes real form and mascot review scenarios", async () => {
  const [contactStory, petStory, foundations] = await Promise.all([
    read("src/lab/stories/contact-form-hub.stories.js"),
    read("src/lab/stories/portfolio-pet.stories.js"),
    read("src/lab/stories/foundations.stories.js"),
  ]);
  for (const scenario of ["Focused", "FilledDraft", "Validation", "CollapsedRestore"]) {
    assert.match(contactStory, new RegExp(`export const ${scenario}`));
  }
  assert.match(petStory, /argTypes:/);
  assert.match(contactStory, /argTypes:/);
  assert.match(petStory, /export const ReviewPlayground/);
  assert.match(contactStory, /options: \["closed", "open", "focused", "filled", "validation", "collapsed"\]/);
  assert.match(foundations, /export const Controls/);
});


test("contact form design-system contract is mandatory in Fast CI", () => {
  assert.equal(fastTests.has("test/contact-form-design-system.test.mjs"), true);
});
