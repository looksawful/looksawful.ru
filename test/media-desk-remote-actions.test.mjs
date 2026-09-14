import assert from "node:assert/strict";
import test from "node:test";

import {
  assignPetCoverFromInventory,
  assignProjectCoverFromInventory,
  blockingDeleteUsages,
  deleteInventoryRecord,
  replaceInventoryRecord,
  remoteControlState,
} from "../src/devtools/media-desk/remote-actions.ts";

function record(overrides = {}) {
  return {
    assetId: "awful-cases-assets-decor-1",
    item: {
      origin: "registered",
      asset: { id: "awful-cases-assets-decor-1", type: "image", src: "/pets/awful-cases/assets/decor-1.png" },
    },
    usages: [],
    ...overrides,
  };
}

test("delete action stops before network when blocking usages exist", async () => {
  const calls = [];
  const selected = record({
    assetId: "cms-74f88a53-7663-4eb4-a1cb-d300f219d8ab",
    item: { origin: "cms", asset: { id: "cms-74f88a53-7663-4eb4-a1cb-d300f219d8ab", type: "image", src: "/media/catalog/74f88a53-7663-4eb4-a1cb-d300f219d8ab.webp" } },
    usages: [{ kind: "page-media", ownerId: "awful-cases", sourcePath: "page.js", blockingDelete: true }],
  });
  const session = {
    assetRevision: async (...args) => { calls.push(["revision", ...args]); return { revision: "r".repeat(64), head: "head-a" }; },
    postJson: async (...args) => { calls.push(["post", ...args]); return { ok: true }; },
  };
  await assert.rejects(() => deleteInventoryRecord(session, selected), (error) => error?.blockingUsages?.length === 1);
  assert.deepEqual(calls, []);
});

test("replace action versions CMS source by identity before multipart commit", async () => {
  const calls = [];
  const selected = record({
    assetId: "cms-74f88a53-7663-4eb4-a1cb-d300f219d8ab",
    item: { origin: "cms", asset: { id: "cms-74f88a53-7663-4eb4-a1cb-d300f219d8ab", type: "image", src: "/media/catalog/74f88a53-7663-4eb4-a1cb-d300f219d8ab.webp" } },
  });
  const session = {
    assetRevision: async (assetId, surface) => { calls.push(["revision", assetId, surface]); return { revision: "a".repeat(64), head: "head-a" }; },
    postMultipart: async (path, metadata, file) => { calls.push(["multipart", path, metadata, file.name]); return { ok: true, branchHead: "head-b" }; },
  };
  const file = new File([new Uint8Array([1])], "replacement.webp", { type: "image/webp" });
  await replaceInventoryRecord(session, selected, file);
  assert.deepEqual(calls[0], ["revision", selected.assetId, "source"]);
  assert.equal(calls[1][0], "multipart");
  assert.equal(calls[1][1], "/api/media/replace");
  assert.deepEqual(calls[1][2], { assetId: selected.assetId, expectedRevision: "a".repeat(64) });
});

test("remote control state disables delete for blocking CMS dependencies", () => {
  const base = record({
    assetId: "cms-74f88a53-7663-4eb4-a1cb-d300f219d8ab",
    item: { origin: "cms", asset: { id: "cms-74f88a53-7663-4eb4-a1cb-d300f219d8ab", type: "image", src: "/media/catalog/74f88a53-7663-4eb4-a1cb-d300f219d8ab.webp" } },
  });
  const free = remoteControlState(base);
  assert.equal(free.replaceEnabled, true);
  assert.equal(free.deleteEnabled, true);
  const blocked = remoteControlState({ ...base, usages: [{ kind: "page-media", ownerId: "awful-cases", sourcePath: "page.js", blockingDelete: true }] });
  assert.equal(blocked.replaceEnabled, true);
  assert.equal(blocked.deleteEnabled, false);
  assert.match(blocked.deleteReason, /page-media.*awful-cases/i);
});

test("project cover action versions projects source and assigns selected image", async () => {
  const calls = [];
  const session = {
    sourceRevision: async (path) => { calls.push(["revision", path]); return { path, revision: "p".repeat(64), head: "head-a" }; },
    postJson: async (path, body) => { calls.push(["post", path, body]); return { ok: true }; },
  };
  const image = record({ item: { origin: "registered", asset: { id: "cover-a", type: "image", src: "/media/projects/index/a.webp", width: 1580, height: 1360 } } });
  await assignProjectCoverFromInventory(session, image, "jestei");
  assert.deepEqual(calls[0], ["revision", "src/content/projects.json"]);
  assert.equal(calls[1][1], "/api/media/assign");
  assert.deepEqual(calls[1][2].target, { kind: "project-cover", ownerId: "jestei" });
  assert.equal(calls[1][2].expectedRevision, "p".repeat(64));
  assert.deepEqual(calls[1][2].asset, { id: "cover-a", type: "image", src: "/media/projects/index/a.webp", width: 1580, height: 1360 });
});

test("pet cover action requires an existing entry belonging to selected asset", async () => {
  const calls = [];
  const session = {
    sourceRevision: async (path) => { calls.push(["revision", path]); return { path, revision: "q".repeat(64), head: "head-a" }; },
    postJson: async (path, body) => { calls.push(["post", path, body]); return { ok: true }; },
  };
  const selected = record({ usage: { entryIds: ["entry-a"] }, usages: [] });
  await assignPetCoverFromInventory(session, selected, "awful-cases", "entry-a");
  assert.deepEqual(calls[0], ["revision", "src/content/subproject-card-covers.json"]);
  assert.equal(calls[1][1], "/api/media/assign");
  assert.deepEqual(calls[1][2].target, { kind: "pet-cover", ownerId: "awful-cases" });
  assert.equal(calls[1][2].entryId, "entry-a");
  await assert.rejects(() => assignPetCoverFromInventory(session, selected, "awful-cases", "entry-b"), /does not belong to selected asset/i);
});
