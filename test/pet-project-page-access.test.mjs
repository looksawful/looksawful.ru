import assert from "node:assert/strict";
import test from "node:test";

import { getPageByPath, sitePages } from "../src/site/pages/manifest.ts";

const unfinishedPages = [
  ["project:berserk-timer", "/work/berserk-timer/"],
  ["project:awful-studio", "/work/awful-studio/"],
];

test("unfinished Pet Project pages stay defined but are not publicly routable", () => {
  for (const [id, path] of unfinishedPages) {
    const page = sitePages.find((candidate) => candidate.id === id);
    assert.ok(page, `missing unfinished Pet Project page ${id}`);
    assert.equal(page.enabled, false);
    assert.equal(page.discovery.listed, false);
    assert.equal(page.discovery.indexable, false);
    assert.equal(getPageByPath(path), undefined);
  }
});
