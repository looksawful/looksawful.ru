import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  decodeEntities,
  extractJsonLdBlocks,
} from "../tools/site-html-utils.mjs";

const importerSource = readFileSync(
  new URL("../tools/import-behance-shootings.mjs", import.meta.url),
  "utf8",
);

test("HTML entity decoding is single-pass", () => {
  assert.equal(decodeEntities("&lt;"), "<");
  assert.equal(decodeEntities("&amp;lt;"), "&lt;");
  assert.equal(decodeEntities("&amp;amp;"), "&amp;");
  assert.equal(decodeEntities("&#39;&apos;&quot;"), "''\"");
});

test("JSON-LD extraction respects greater-than characters inside quoted attributes", () => {
  const html = '<script data-note="a>b" type="application/ld+json">{"@type":"Thing"}</script>';
  assert.deepEqual(extractJsonLdBlocks(html), ['{"@type":"Thing"}']);
});

test("Behance TypeScript string escaping has no replacement-with-itself operations", () => {
  assert.doesNotMatch(
    importerSource,
    /\.replaceAll\("\\\\u2028",\s*"\\\\u2028"\)/,
  );
  assert.doesNotMatch(
    importerSource,
    /\.replaceAll\("\\\\u2029",\s*"\\\\u2029"\)/,
  );
});
