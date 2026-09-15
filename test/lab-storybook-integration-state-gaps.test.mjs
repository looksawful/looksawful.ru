import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("site navigation story uses production owners and covers disclosure, overlay, reduced motion and all review viewports", async () => {
  const story = await read("src/lab/stories/site-navigation.stories.js");

  assert.match(story, /initSiteNavigation/);
  assert.match(story, /renderSiteNavigation/);
  assert.match(story, /sitePages/);
  assert.match(story, /src\/components\/site-navigation\.ts/);
  assert.match(story, /src\/site\/shell\/navigation\.ts/);
  assert.match(story, /visibility:\s*\["disclosure",\s*"overlay",\s*"input-capability"\]/);
  assert.match(story, /motion:\s*\["reduced-motion"\]/);
  assert.match(story, /review:\s*\["desktop",\s*"tablet",\s*"mobile"\]/);
  assert.match(story, /a11y-reviewed/);
});
