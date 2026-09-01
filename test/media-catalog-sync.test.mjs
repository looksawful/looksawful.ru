import assert from "node:assert/strict";
import test from "node:test";

test("media catalog import index is deterministic and separates registered records from uploads", async () => {
  const { renderMediaCatalogImportIndex } = await import("../tools/sync-media-catalog.mjs");
  const output = renderMediaCatalogImportIndex({
    registeredFilenames: ["zeta.json", "alpha.json"],
    uploadedFilenames: ["second.json", "first.json"],
  });

  assert.ok(output.indexOf("alpha.json") < output.indexOf("zeta.json"));
  assert.ok(output.indexOf("first.json") < output.indexOf("second.json"));
  assert.match(output, /registeredMediaCatalogSources/);
  assert.match(output, /uploadedMediaCatalogSources/);
  assert.match(output, /This file is generated/);
});
