import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

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

test("unchanged upload structural validation needs no ffprobe and rejects stale/missing sources", async () => {
  const { checkStoredUploadedRecord, syncMediaCatalog } = await import("../tools/sync-media-catalog.mjs");
  const root = await mkdtemp(path.join(tmpdir(), "catalog-stored-"));
  await mkdir(path.join(root, "public/media"), { recursive: true });
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==", "base64");
  await writeFile(path.join(root, "public/media/pixel.png"), png);
  const record = { mediaType: "image", src: "/media/pixel.png", width: 1, height: 1, mimeType: "image/png", byteLength: png.length };
  assert.deepEqual(await checkStoredUploadedRecord(record, { repoRoot: root }), record);
  await assert.rejects(checkStoredUploadedRecord({ ...record, byteLength: png.length + 1 }, { repoRoot: root }), /stale/);
  await assert.rejects(checkStoredUploadedRecord({ ...record, src: "/media/missing.png" }, { repoRoot: root }), /does not exist/);
  await assert.rejects(syncMediaCatalog({ repoRoot: root, checkStored: true }), /read-only/);
});
