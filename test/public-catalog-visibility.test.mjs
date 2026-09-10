import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { registeredMediaAssets } from "../src/data/media/assets/registered.ts";
import {
  getMediaCatalogItem,
  parseRegisteredMediaCatalogRecord,
} from "../src/data/media/catalog.ts";

const registeredRecordUrl = new URL(
  "../src/content/media-catalog/registered/obladaet-01-source-02-2x3.json",
  import.meta.url,
);

async function readRegisteredRecord() {
  return JSON.parse(await readFile(registeredRecordUrl, "utf8"));
}

test("legacy media catalog records default to hidden from the Public Catalog", async () => {
  const source = await readRegisteredRecord();
  assert.equal("showInCatalog" in source, false);

  const parsed = parseRegisteredMediaCatalogRecord(source, registeredMediaAssets);
  assert.equal(parsed.showInCatalog, false);
  assert.equal(getMediaCatalogItem(source.id).showInCatalog, false);
});

test("media catalog accepts an explicit public visibility flag and validates its type", async () => {
  const source = await readRegisteredRecord();

  const visible = parseRegisteredMediaCatalogRecord(
    { ...source, showInCatalog: true },
    registeredMediaAssets,
  );
  assert.equal(visible.showInCatalog, true);

  assert.throws(
    () => parseRegisteredMediaCatalogRecord(
      { ...source, showInCatalog: "yes" },
      registeredMediaAssets,
    ),
    /showInCatalog.*boolean/i,
  );
});
