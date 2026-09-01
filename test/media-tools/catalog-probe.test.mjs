import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("upload technical sync probes an image without rewriting authored catalog metadata", async () => {
  const { syncUploadedRecord } = await import("../../tools/sync-media-catalog.mjs");
  const root = await mkdtemp(path.join(tmpdir(), "looksawful-media-catalog-"));
  const publicDir = path.join(root, "public", "media", "catalog");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(publicDir, { recursive: true });

  const imagePath = path.join(publicDir, "pixel.png");
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg==",
    "base64",
  );
  await writeFile(imagePath, onePixelPng);

  const record = {
    id: "726ba957-9cf9-4466-80a6-a8836e27910a",
    mediaType: "image",
    src: "/media/catalog/pixel.png",
    deliverySrc: "",
    posterSrc: "",
    width: 0,
    height: 0,
    durationSeconds: 0,
    mimeType: "",
    byteLength: 0,
    title: "Do not rewrite this title",
    alt: "Authored alt",
    description: "Authored description",
    date: "2026",
    projectIds: [],
    workAreaIds: ["photography"],
    projectTypeIds: [],
    deliverableIds: [],
    tags: ["test"],
    credits: ["Author"],
    reusable: true,
    archived: false,
  };

  const synced = await syncUploadedRecord(record, { repoRoot: root });
  assert.equal(synced.width, 1);
  assert.equal(synced.height, 1);
  assert.equal(synced.mimeType, "image/png");
  assert.equal(synced.byteLength, onePixelPng.byteLength);
  assert.equal(synced.title, record.title);
  assert.equal(synced.alt, record.alt);
  assert.equal(synced.description, record.description);
  assert.deepEqual(synced.tags, record.tags);
  assert.deepEqual(synced.credits, record.credits);

  assert.equal(await readFile(imagePath).then((value) => value.byteLength), onePixelPng.byteLength);
});
