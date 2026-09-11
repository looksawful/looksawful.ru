import test from "node:test";
import assert from "node:assert/strict";

import { sitePages } from "../src/site/pages/manifest.ts";
import { LAB_PAGE_CATALOG } from "../src/devtools/lab/catalog.ts";
import { deriveLabPageLifecycle } from "../src/devtools/lab/types.ts";

test("Lab lifecycle derives live, hidden, and wip deterministically", () => {
  assert.equal(deriveLabPageLifecycle({ listed: true, indexable: true }), "live");
  assert.equal(deriveLabPageLifecycle({ listed: false, indexable: false }), "hidden");
  assert.equal(
    deriveLabPageLifecycle({
      listed: false,
      indexable: false,
      developmentStatus: "wip",
    }),
    "wip",
  );
});

test("every canonical site page remains represented in the Lab catalog", () => {
  assert.equal(LAB_PAGE_CATALOG.length, sitePages.length);
  for (const page of sitePages) {
    assert.ok(
      LAB_PAGE_CATALOG.some((entry) => entry.id === page.id && entry.path === page.path),
      `missing canonical Lab page ${page.id}`,
    );
  }
});

test("current canonical discovery flags are preserved by the Lab projection", () => {
  for (const page of sitePages) {
    const entry = LAB_PAGE_CATALOG.find((candidate) => candidate.id === page.id);
    assert.ok(entry, `missing canonical Lab page ${page.id}`);
    assert.equal(entry.listed, page.discovery.listed);
    assert.equal(entry.indexable, page.discovery.indexable);
  }
});
