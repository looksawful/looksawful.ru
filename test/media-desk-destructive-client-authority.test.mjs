import assert from "node:assert/strict";
import test from "node:test";

import {
  deleteInventoryRecord,
  replaceInventoryRecord,
  remoteControlState,
} from "../src/devtools/media-desk/remote-actions.ts";

const uuid = "74f88a53-7663-4eb4-a1cb-d300f219d8ab";
function registered() {
  return {
    assetId: "registered-a",
    item: { origin: "registered", asset: { id: "registered-a", type: "image", src: "/media/a.webp" } },
    usages: [],
  };
}
function cms() {
  return {
    assetId: `cms-${uuid}`,
    item: { origin: "cms", asset: { id: `cms-${uuid}`, type: "image", src: `/media/catalog/${uuid}.webp` } },
    usages: [],
  };
}
test("registered media is never remotely replaceable or deletable", async () => {
  const state = remoteControlState(registered());
  assert.equal(state.replaceEnabled, false);
  assert.equal(state.deleteEnabled, false);
  assert.match(state.deleteReason, /code-owned|registered/i);

  const calls = [];
  const session = {
    sourceRevision: async (...args) => { calls.push(["revision", ...args]); return { revision: "r".repeat(64) }; },
    postJson: async (...args) => { calls.push(["json", ...args]); return { ok: true }; },
    postMultipart: async (...args) => { calls.push(["multipart", ...args]); return { ok: true }; },
  };
  await assert.rejects(() => deleteInventoryRecord(session, registered()), /code-owned|registered/i);
  await assert.rejects(
    () => replaceInventoryRecord(session, registered(), new File([new Uint8Array([1])], "x.webp", { type: "image/webp" })),
    /code-owned|registered/i,
  );
  assert.deepEqual(calls, []);
});
test("CMS destructive requests send asset identity, never repository paths or client usages", async () => {
  const calls = [];
  const session = {
    assetRevision: async (assetId, surface) => {
      calls.push(["revision", assetId, surface]);
      return { revision: surface === "source" ? "s".repeat(64) : "c".repeat(64) };
    },
    postJson: async (path, body) => { calls.push(["json", path, body]); return { ok: true }; },
    postMultipart: async (path, metadata, file) => { calls.push(["multipart", path, metadata, file.name]); return { ok: true }; },
  };
  await deleteInventoryRecord(session, cms());
  await replaceInventoryRecord(
    session,
    cms(),
    new File([new Uint8Array([1, 2, 3])], `${uuid}.webp`, { type: "image/webp" }),
  );

  assert.deepEqual(calls[0], ["revision", `cms-${uuid}`, "catalog"]);
  assert.deepEqual(calls[1], ["json", "/api/media/delete", { assetId: `cms-${uuid}`, expectedRevision: "c".repeat(64) }]);
  assert.deepEqual(calls[2], ["revision", `cms-${uuid}`, "source"]);
  assert.equal(calls[3][1], "/api/media/replace");
  assert.deepEqual(calls[3][2], { assetId: `cms-${uuid}`, expectedRevision: "s".repeat(64) });
});

test("remote replace UI is fail-closed for unsupported CMS formats", () => {
  assert.equal(remoteControlState(cms()).replaceEnabled, true);
  const video = cms();
  video.item = { origin: "cms", asset: { id: video.assetId, type: "video", src: `/media/catalog/${uuid}.mp4` } };
  assert.equal(remoteControlState(video).replaceEnabled, false);
  const avif = cms();
  avif.item = { origin: "cms", asset: { id: avif.assetId, type: "image", src: `/media/catalog/${uuid}.avif` } };
  assert.equal(remoteControlState(avif).replaceEnabled, false);
});