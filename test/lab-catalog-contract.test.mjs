import test from "node:test";
import assert from "node:assert/strict";

import { sitePages } from "../src/site/pages/manifest.ts";
import { LAB_PAGE_CATALOG } from "../src/devtools/lab/catalog.ts";

test("Lab page catalog projects every canonical site page without filtering hidden pages", () => {
  assert.equal(LAB_PAGE_CATALOG.length, sitePages.length);

  for (const page of sitePages) {
    const labPage = LAB_PAGE_CATALOG.find((entry) => entry.id === page.id);
    assert.ok(labPage, `missing Lab page: ${page.id}`);
    assert.equal(labPage.path, page.path);
    assert.equal(labPage.listed, page.discovery.listed);
    assert.equal(labPage.indexable, page.discovery.indexable);
    assert.equal(labPage.labVisible, true);
  }
});

test("non-public canonical pages remain visible in Lab and are marked hidden", () => {
  const hiddenCanonicalPages = sitePages.filter(
    (page) => !page.discovery.listed || !page.discovery.indexable,
  );

  assert.ok(hiddenCanonicalPages.length > 0, "expected at least one hidden canonical page");

  for (const page of hiddenCanonicalPages) {
    const labPage = LAB_PAGE_CATALOG.find((entry) => entry.id === page.id);
    assert.ok(labPage, `hidden page missing from Lab: ${page.id}`);
    assert.equal(labPage.visibility, "hidden");
    assert.equal(labPage.labVisible, true);
  }
});

test("Lab page catalog preserves unique canonical identities and paths", () => {
  const ids = LAB_PAGE_CATALOG.map((entry) => entry.id);
  const paths = LAB_PAGE_CATALOG.map((entry) => entry.path);

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(paths).size, paths.length);
});
