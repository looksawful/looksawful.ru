import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const smoke = await readFile(new URL("../tools/lab/smoke-storybook.mjs", import.meta.url), "utf8");

test("Storybook smoke fails only on visible error surfaces", () => {
  assert.match(smoke, /locator\("#error-message, \.sb-errordisplay"\)/);
  assert.match(smoke, /filter\(\{ visible: true \}\)|isVisible\(/);
  assert.doesNotMatch(smoke, /locator\("#error-message, \.sb-errordisplay"\)\.count\(\)/);
});


test("Storybook smoke includes body-level PhotoSwipe overlays in axe scope", () => {
  assert.doesNotMatch(smoke, /axe\.run\("#storybook-root"/);
  assert.match(smoke, /querySelector\("\.pswp"\)/);
  assert.match(smoke, /include:[\s\S]*#storybook-root[\s\S]*\.pswp/s);
});
