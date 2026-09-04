import assert from "node:assert/strict";
import test from "node:test";

import {
  applyMediaDeskMetadata,
  idsBetween,
} from "../src/tools/media-desk/browser-layout.ts";

const item = {
  origin: "registered",
  asset: { id: "asset-a", type: "image", src: "/a.jpg", width: 1200, height: 800 },
  title: "Old",
  alt: "",
  description: "",
  date: "",
  projectIds: [],
  workAreaIds: [],
  projectTypeIds: [],
  deliverableIds: [],
  tags: [],
  credits: [],
  reusable: false,
  archived: false,
};

test("idsBetween returns inclusive selection ranges in either direction", () => {
  const ids = ["a", "b", "c", "d"];
  assert.deepEqual(idsBetween(ids, "b", "d"), ["b", "c", "d"]);
  assert.deepEqual(idsBetween(ids, "d", "b"), ["b", "c", "d"]);
  assert.deepEqual(idsBetween(ids, null, "c"), ["c"]);
});

test("applyMediaDeskMetadata changes editorial metadata without mutating asset fields", () => {
  const next = applyMediaDeskMetadata(item, {
    title: "New",
    tags: ["updated"],
  });
  assert.equal(next.title, "New");
  assert.deepEqual(next.tags, ["updated"]);
  assert.equal(next.asset, item.asset);
  assert.equal(item.title, "Old");
});
