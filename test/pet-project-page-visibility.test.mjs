import assert from "node:assert/strict";
import test from "node:test";

import { sitePages } from "../src/site/pages/manifest.ts";

const previewOnlyPetProjectIds = [
  "project:berserk-timer",
  "project:awful-studio",
];

test("unfinished Pet Project pages stay outside public discovery", () => {
  for (const id of previewOnlyPetProjectIds) {
    const page = sitePages.find((candidate) => candidate.id === id);
    assert.ok(page, `missing preview-only Pet Project page ${id}`);
    assert.equal(page.enabled, true);
    assert.equal(page.discovery.listed, false);
    assert.equal(page.discovery.indexable, false);
  }
});
