import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSiteCopyExport,
  validateSiteCopyExport,
} from "../tools/editorial/export-site-copy.mjs";

let cached;
async function exportResult() {
  cached ??= await buildSiteCopyExport();
  return cached;
}

test("site copy export is structurally valid and covers every enabled content route", async () => {
  const result = await exportResult();

  assert.equal(result.schemaVersion, 1);
  assert.ok(result.stats.entries > 0);
  assert.equal(result.stats.entries, result.entries.length);
  assert.equal(result.stats.coveredRoutes, result.stats.totalRoutes);
  assert.deepEqual(validateSiteCopyExport(result), []);

  for (const entry of result.entries) {
    assert.equal(typeof entry.source, "string");
    assert.ok(entry.source.length > 0);
    assert.equal(typeof entry.field, "string");
    assert.ok(entry.field.length > 0);
    assert.ok(entry.locale === "ru" || entry.locale === "en");
    assert.equal(typeof entry.text, "string");
    assert.ok(entry.text.trim().length > 0);
  }
});

test("Jestei source copy preserves source location and metric meaning in RU and EN", async () => {
  const result = await exportResult();

  const ruMetric = result.entries.find((entry) =>
    entry.pageId === "case:jestei-pool"
    && entry.locale === "ru"
    && entry.source === "src/content/cases/jestei-pool.json"
    && entry.text.includes("Стоимость производства баннеров сократилась в 2,5 раза"),
  );
  const enMetric = result.entries.find((entry) =>
    entry.pageId === "case:jestei-pool"
    && entry.locale === "en"
    && entry.source === "src/content/i18n/en/cases/jestei-pool.json"
    && entry.text.includes("reducing banner production costs by 2.5×"),
  );

  assert.ok(ruMetric, "RU Jestei banner-cost claim must be exported from its authored source");
  assert.ok(enMetric, "EN Jestei banner-cost claim must be exported from its authored source");
  assert.equal(ruMetric.route, "/work/jestei-pool/");
  assert.equal(enMetric.route, "/work/jestei-pool/");
  assert.equal(ruMetric.section, "home");
  assert.equal(enMetric.section, "home");
});

test("source-first export excludes structural identifiers as copy entries", async () => {
  const result = await exportResult();
  const forbiddenFields = new Set([
    "id",
    "entryId",
    "projectId",
    "href",
    "url",
    "src",
    "path",
    "className",
    "type",
    "kind",
    "layout",
  ]);

  assert.equal(
    result.entries.some((entry) => forbiddenFields.has(entry.field)),
    false,
    "structural fields must not enter the editorial corpus",
  );
});
