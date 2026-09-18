import assert from "node:assert/strict";
import test from "node:test";

import labConfig from "../vite.lab.config.ts";
import storybookViteConfig from "../tools/lab/storybook/vite.config.mjs";

test("Lab enables Lightning CSS scroll navigation draft syntax", () => {
  assert.equal(
    labConfig.css?.lightningcss?.drafts?.scrollNavigationControls,
    true,
  );
});

test("Storybook enables Lightning CSS scroll navigation draft syntax", () => {
  assert.equal(
    storybookViteConfig.css?.lightningcss?.drafts?.scrollNavigationControls,
    true,
  );
});
