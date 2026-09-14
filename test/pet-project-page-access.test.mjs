import assert from "node:assert/strict";
import test from "node:test";

import { getPageByPath, sitePages } from "../src/site/pages/manifest.ts";

test("Berserk Timer is publicly routable but remains unlisted and non-indexable", () => {
  const page = sitePages.find((candidate) => candidate.id === "project:berserk-timer");
  assert.ok(page, "missing Berserk Timer page");
  assert.equal(page.enabled, true);
  assert.equal(page.discovery.listed, false);
  assert.equal(page.discovery.indexable, false);
  assert.equal(getPageByPath("/work/berserk-timer/")?.id, "project:berserk-timer");
});

test("AWFUL STUDIO stays defined but not publicly routable", () => {
  const page = sitePages.find((candidate) => candidate.id === "project:awful-studio");
  assert.ok(page, "missing AWFUL STUDIO page");
  assert.equal(page.enabled, false);
  assert.equal(page.discovery.listed, false);
  assert.equal(page.discovery.indexable, false);
  assert.equal(getPageByPath("/work/awful-studio/"), undefined);
});
