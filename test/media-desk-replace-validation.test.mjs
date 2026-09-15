import assert from "node:assert/strict";
import test from "node:test";

import { planReplace } from "../tools/cloudflare/media-desk/media-mutations.mjs";

const UUID = "74f88a53-7663-4eb4-a1cb-d300f219d8ab";
const ASSET_ID = `cms-${UUID}`;

function png(width, height) {
  const bytes = new Uint8Array(32);
  bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
  bytes.set([0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52], 8);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}
function resolved(overrides = {}) {
  return {
    assetId: ASSET_ID,
    persistedId: UUID,
    catalogPath: `src/content/media-catalog/uploads/${UUID}.json`,
    filePath: `public/media/catalog/${UUID}.png`,
    extension: "png",
    expectedMime: "image/png",
    record: {
      id: UUID, mediaType: "image", src: `/media/catalog/${UUID}.png`,
      width: 2, height: 3, durationSeconds: 0, mimeType: "image/png", byteLength: 10,
      title: "x", alt: "", description: "", date: "", projectIds: [], workAreaIds: [],
      projectTypeIds: [], deliverableIds: [], tags: [], credits: [], showInCatalog: false,
      reusable: false, archived: false,
    },
    ...overrides,
  };
}
test("CMS image replace validates bytes and atomically updates technical metadata", () => {
  const bytes = png(320, 240);
  const plan = planReplace({
    resolved: resolved(),
    file: { name: "next.png", type: "image/png", bytes },
    expectedRevision: "r".repeat(64),
    expectedHead: "head-a",
  });
  assert.equal(plan.assetId, ASSET_ID);
  assert.equal(plan.filePath, `public/media/catalog/${UUID}.png`);
  assert.equal(plan.catalogPath, `src/content/media-catalog/uploads/${UUID}.json`);
  assert.equal(plan.catalogRecord.width, 320);
  assert.equal(plan.catalogRecord.height, 240);
  assert.equal(plan.catalogRecord.mimeType, "image/png");
  assert.equal(plan.catalogRecord.byteLength, bytes.byteLength);
  assert.deepEqual(plan.writes.map(({ path }) => path), [plan.filePath, plan.catalogPath]);
});

test("CMS image replace rejects format substitution and invalid magic", () => {
  const base = { resolved: resolved(), expectedRevision: "r".repeat(64), expectedHead: "head-a" };
  assert.throws(
    () => planReplace({ ...base, file: { name: "next.jpg", type: "image/jpeg", bytes: png(1, 1) } }),
    /same format|extension|mime/i,
  );
  assert.throws(
    () => planReplace({ ...base, file: { name: "next.png", type: "image/png", bytes: new Uint8Array([1,2,3,4]) } }),
    /signature|png|invalid/i,
  );
});