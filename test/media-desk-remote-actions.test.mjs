import assert from "node:assert/strict";
import test from "node:test";

import {
  assignPetCoverFromInventory,
  assignProjectCoverFromInventory,
  blockingDeleteUsages,
  deleteInventoryRecord,
  mutationTargetForInventoryRecord,
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

test("registered mutation target uses canonical catalog record and public source path", () => {
  const target = mutationTargetForInventoryRecord(record());
  assert.deepEqual(target, {
    id: "awful-cases-assets-decor-1",
    filePath: "public/pets/awful-cases/assets/decor-1.png",
    catalogPath: "src/content/media-catalog/registered/awful-cases-assets-decor-1.json",
    usages: [],
  });
});

test("CMS video mutation target preserves runtime identity but replaces original source", () => {
  const id = "74f88a53-7663-4eb4-a1cb-d300f219d8ab";
  const target = mutationTargetForInventoryRecord(record({
    assetId: `cms-${id}`,
    item: {
      origin: "cms",
      asset: {
        id: `cms-${id}`,
        type: "video",
        src: "/media/generated/video/catalog/sample.web.mp4",
        sourceSrc: `/media/catalog/${id}.mov`,
      },
    },
  }));
  assert.equal(target.id, `cms-${id}`);
  assert.equal(target.filePath, `public/media/catalog/${id}.mov`);
  assert.equal(target.catalogPath, `src/content/media-catalog/uploads/${id}.json`);
});

test("delete safety exposes every blocking usage and rejects non-public source paths", () => {
  const usages = [
    { kind: "page-media", ownerId: "awful-cases", sourcePath: "public/pets/awful-cases/awful-cases.js", blockingDelete: true },
    { kind: "gallery", ownerId: "gallery", sourcePath: "src/data/media/public-catalog.ts", blockingDelete: false },
  ];
  assert.deepEqual(blockingDeleteUsages(record({ usages })), [usages[0]]);
  assert.throws(
    () => mutationTargetForInventoryRecord(record({ item: { origin: "registered", asset: { id: "x", type: "image", src: "https://cdn.example/x.webp" } } })),
    /not repository-backed/i,
  );
});

test("delete action stops before network when blocking usages exist", async () => {
  const calls = [];
  const session = {
    sourceRevision: async (...args) => { calls.push(["revision", ...args]); return { revision: "r".repeat(64), head: "head-a" }; },
    postJson: async (...args) => { calls.push(["post", ...args]); return { ok: true }; },
  };
  const blocked = record({ usages: [{ kind: "page-media", ownerId: "awful-cases", sourcePath: "page.js", blockingDelete: true }] });
  await assert.rejects(() => deleteInventoryRecord(session, blocked), (error) => error?.blockingUsages?.length === 1);
  assert.deepEqual(calls, []);
});

test("replace action versions the physical source before multipart commit", async () => {
  const calls = [];
  const session = {
    sourceRevision: async (path) => { calls.push(["revision", path]); return { path, revision: "a".repeat(64), head: "head-a" }; },
    postMultipart: async (path, metadata, file) => { calls.push(["multipart", path, metadata, file.name]); return { ok: true, branchHead: "head-b" }; },
  };
  const file = new File([new Uint8Array([1])], "replacement.png", { type: "image/png" });
  await replaceInventoryRecord(session, record(), file);
  assert.equal(calls[0][0], "revision");
  assert.equal(calls[0][1], "public/pets/awful-cases/assets/decor-1.png");
  assert.equal(calls[1][0], "multipart");
  assert.equal(calls[1][1], "/api/media/replace");
  assert.equal(calls[1][2].expectedRevision, "a".repeat(64));
  assert.deepEqual(calls[1][2].asset, { id: "awful-cases-assets-decor-1", filePath: "public/pets/awful-cases/assets/decor-1.png" });
});


test("remote control state disables delete for blocking dependencies", () => {
  const free = remoteControlState(record());
  assert.equal(free.replaceEnabled, true);
  assert.equal(free.deleteEnabled, true);

  const blocked = remoteControlState(record({ usages: [{ kind: "page-media", ownerId: "awful-cases", sourcePath: "page.js", blockingDelete: true }] }));
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
