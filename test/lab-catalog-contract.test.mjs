import test from "node:test";
import assert from "node:assert/strict";

import { SITE_PAGE_DEFINITIONS } from "../src/site/pages/manifest.ts";
import { LAB_PAGE_CATALOG } from "../src/devtools/lab/catalog.ts";

test("Lab page catalog projects every canonical site page without filtering hidden pages", () => {
  assert.equal(LAB_PAGE_CATALOG.length, SITE_PAGE_DEFINITIONS.length);

  for (const page of SITE_PAGE_DEFINITIONS) {
    const labPage = LAB_PAGE_CATALOG.find((entry) => entry.id === page.id);
    assert.ok(labPage, `missing Lab page: ${page.id}`);
    assert.equal(labPage.route, page.route);
    assert.equal(labPage.listed, page.listed);
    assert.equal(labPage.indexable, page.indexable);
    assert.equal(labPage.labVisible, true);
  }
});

test("non-public canonical pages remain visible in Lab and are marked hidden", () => {
  const hiddenCanonicalPages = SITE_PAGE_DEFINITIONS.filter(
    (page) => !page.listed || !page.indexable,
  );

  assert.ok(hiddenCanonicalPages.length > 0, "expected at least one hidden canonical page");

  for (const page of hiddenCanonicalPages) {
    const labPage = LAB_PAGE_CATALOG.find((entry) => entry.id === page.id);
    assert.ok(labPage, `hidden page missing from Lab: ${page.id}`);
    assert.equal(labPage.visibility, "hidden");
    assert.equal(labPage.labVisible, true);
  }
});

test("Lab page catalog preserves unique canonical identities and routes", () => {
  const ids = LAB_PAGE_CATALOG.map((entry) => entry.id);
  const routes = LAB_PAGE_CATALOG.map((entry) => entry.route);

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(routes).size, routes.length);
});
