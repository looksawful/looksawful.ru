import assert from "node:assert/strict";
import test from "node:test";

import {
  createLabPageCatalog,
  labPageCatalog,
} from "../src/devtools/lab/page-catalog.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

test("Lab catalog mirrors every canonical SitePage without public-visibility filtering", () => {
  assert.equal(labPageCatalog.length, sitePages.length);
  assert.deepEqual(
    labPageCatalog.map(({ id, path }) => ({ id, path })),
    sitePages.map(({ id, path }) => ({ id, path })),
  );

  for (const page of sitePages) {
    const entry = labPageCatalog.find(({ id }) => id === page.id);
    assert.ok(entry, `${page.id} must remain visible in Lab`);
    assert.equal(entry.enabled, page.enabled);
    assert.equal(entry.listed, page.discovery.listed);
    assert.equal(entry.indexable, page.discovery.indexable);
  }
});

test("unlisted or non-indexable canonical pages are HIDDEN in Lab rather than omitted", () => {
  for (const id of [
    "project:awful-cases",
    "project:moves-awful",
    "project:berry-social-content-2020",
    "not-found",
  ]) {
    const entry = labPageCatalog.find((candidate) => candidate.id === id);
    assert.ok(entry, `${id} must be present in Lab`);
    assert.equal(entry.lifecycle, "HIDDEN");
  }
});

test("Lab-only WIP metadata does not change canonical public page visibility", () => {
  const canonical = structuredClone(sitePages[0]);
  canonical.enabled = false;
  canonical.discovery.listed = false;
  canonical.discovery.indexable = false;

  const [entry] = createLabPageCatalog(
    [canonical],
    { home: { lifecycle: "WIP" } },
  );

  assert.equal(entry.lifecycle, "WIP");
  assert.equal(entry.enabled, false);
  assert.equal(entry.listed, false);
  assert.equal(entry.indexable, false);
  assert.equal(canonical.enabled, false, "Lab catalog must not mutate canonical visibility");
  assert.equal(canonical.discovery.listed, false);
  assert.equal(canonical.discovery.indexable, false);
});

test("disabled pages remain present even without a WIP override", () => {
  const canonical = structuredClone(sitePages[0]);
  canonical.enabled = false;

  const [entry] = createLabPageCatalog([canonical]);
  assert.equal(entry.id, canonical.id);
  assert.equal(entry.lifecycle, "HIDDEN");
});
