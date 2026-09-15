import assert from "node:assert/strict";
import test from "node:test";

let resolver = {};
try {
  resolver = await import("../tools/cloudflare/media-desk/cms-asset.mjs");
} catch {}

const uuid = "74f88a53-7663-4eb4-a1cb-d300f219d8ab";
const assetId = `cms-${uuid}`;

function record(overrides = {}) {
  return {
    id: uuid,
    mediaType: "image",
    src: `/media/catalog/${uuid}.webp`,
    deliverySrc: "",
    posterSrc: "",
    width: 1200,
    height: 1600,
    durationSeconds: 0,
    mimeType: "image/webp",
    byteLength: 123,
    title: "Portrait",
    alt: "",
    description: "",
    date: "",
    projectIds: [],
    workAreaIds: [],
    projectTypeIds: [],
    deliverableIds: [],
    tags: [],
    credits: [],
    showInCatalog: false,
    reusable: false,
    archived: false,
    ...overrides,
  };
}

test("CMS resolver derives catalog and binary paths from asset identity", async () => {
  assert.equal(typeof resolver.resolveCmsAssetRecord, "function");
  const calls = [];
  const resolved = await resolver.resolveCmsAssetRecord({
    assetId,
    readSource: async (path) => {
      calls.push(path);
      return {
        text: `${JSON.stringify(record(), null, 2)}\n`,
        revision: "c".repeat(64),
        branchHead: "head-a",
      };
    },
  });
  assert.deepEqual(calls, [`src/content/media-catalog/uploads/${uuid}.json`]);
  assert.equal(resolved.assetId, assetId);
  assert.equal(resolved.catalogPath, `src/content/media-catalog/uploads/${uuid}.json`);
  assert.equal(resolved.filePath, `public/media/catalog/${uuid}.webp`);
  assert.equal(resolved.revision, "c".repeat(64));
  assert.equal(resolved.branchHead, "head-a");
});

test("CMS resolver rejects registered identities and catalog path substitution", async () => {
  await assert.rejects(
    () => resolver.resolveCmsAssetRecord({
      assetId: "registered-a",
      readSource: async () => { throw new Error("network"); },
    }),
    /cms.*uuid|cms asset/i,
  );
  await assert.rejects(
    () => resolver.resolveCmsAssetRecord({
      assetId,
      readSource: async () => ({
        text: `${JSON.stringify(record({ src: "/media/catalog/other.webp" }))}\n`,
        revision: "r",
        branchHead: "h",
      }),
    }),
    /canonical.*source|source.*asset|path/i,
  );
});
