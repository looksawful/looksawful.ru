import assert from "node:assert/strict";
import test from "node:test";

import {
  planDelete,
  planReplace,
  validateUploadTarget,
} from "../tools/cloudflare/media-desk/media-mutations.mjs";

const MiB = 1024 * 1024;

function assetRecord(overrides = {}) {
  return {
    id: "asset-a",
    asset: { id: "asset-a", type: "image", src: "/media/uploads/asset-a.webp" },
    catalogPath: "src/content/media-catalog/uploads/asset-a.json",
    filePath: "public/media/uploads/asset-a.webp",
    usages: [],
    ...overrides,
  };
}

test("upload target rejects traversal, unsupported extensions and oversized media", () => {
  assert.throws(
    () => validateUploadTarget({ path: "../escape.webp", mediaType: "image", byteLength: 1 }),
    /unsafe upload path/i,
  );
  assert.throws(
    () => validateUploadTarget({ path: "public/media/uploads/file.exe", mediaType: "image", byteLength: 1 }),
    /unsupported media extension/i,
  );
  assert.throws(
    () => validateUploadTarget({ path: "public/media/uploads/file.webp", mediaType: "image", byteLength: 50 * MiB + 1 }),
    /image.*50 mib/i,
  );
  assert.throws(
    () => validateUploadTarget({ path: "public/media/uploads/file.mp4", mediaType: "video", byteLength: 95 * MiB + 1 }),
    /video.*95 mib/i,
  );
});

test("replace preserves identity and requires both revision guards", () => {
  const asset = assetRecord();
  const plan = planReplace({
    asset,
    nextBytes: new Uint8Array([1, 2, 3]),
    expectedRevision: "rev-a",
    expectedHead: "head-a",
  });

  assert.equal(plan.assetId, "asset-a");
  assert.equal(plan.filePath, asset.filePath);
  assert.equal(plan.expectedRevision, "rev-a");
  assert.equal(plan.expectedHead, "head-a");
  assert.throws(
    () => planReplace({ asset, nextBytes: new Uint8Array([1]), expectedRevision: "", expectedHead: "head-a" }),
    /expected revision/i,
  );
  assert.throws(
    () => planReplace({ asset, nextBytes: new Uint8Array([1]), expectedRevision: "rev-a", expectedHead: "" }),
    /expected branch head/i,
  );
});

test("delete blocks referenced assets and reports blocking usages", () => {
  const record = assetRecord({
    usages: [
      {
        kind: "project-cover",
        ownerId: "jestei",
        sourcePath: "src/content/projects.json",
        blockingDelete: true,
      },
    ],
  });

  assert.throws(
    () => planDelete({ record, expectedRevision: "rev-a", expectedHead: "head-a" }),
    (error) => {
      assert.match(error.message, /referenced media cannot be deleted/i);
      assert.deepEqual(error.blockingUsages, record.usages);
      return true;
    },
  );
});

test("unreferenced delete returns explicit file and catalog removals", () => {
  const record = assetRecord();
  const plan = planDelete({ record, expectedRevision: "rev-a", expectedHead: "head-a" });

  assert.deepEqual(plan.removals, [record.filePath, record.catalogPath]);
  assert.equal(plan.assetId, "asset-a");
  assert.equal(plan.expectedRevision, "rev-a");
  assert.equal(plan.expectedHead, "head-a");
});
