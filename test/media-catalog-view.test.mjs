import assert from "node:assert/strict";
import test from "node:test";

import { deriveMediaCatalogItems } from "../src/data/media/catalog-view.ts";

const asset = {
  id: "shared",
  type: "image",
  src: "/media/shared.webp",
};

const base = [{
  origin: "registered",
  asset,
  title: "Shared image",
  alt: "",
  description: "",
  date: "",
  projectIds: ["library-project"],
  workAreaIds: ["graphic-design"],
  projectTypeIds: [],
  deliverableIds: [],
  tags: ["library-tag"],
  credits: [],
  reusable: true,
  archived: false,
}];

test("derived catalog aggregates usage context without mutating entries", () => {
  const entryA = {
    assetId: "shared",
    projectIds: ["project-a"],
    tags: ["tag-a"],
  };
  const entryB = {
    assetId: "shared",
    projectIds: ["project-b"],
    tags: ["tag-b"],
  };

  const [item] = deriveMediaCatalogItems(base, [entryA, entryB]);

  assert.deepEqual(item.projectIds, [
    "library-project",
    "project-a",
    "project-b",
  ]);
  assert.deepEqual(item.tags, ["library-tag", "tag-a", "tag-b"]);

  assert.deepEqual(entryA.projectIds, ["project-a"]);
  assert.deepEqual(entryB.projectIds, ["project-b"]);
});

test("asset with no usage preserves the library catalog item", () => {
  const [item] = deriveMediaCatalogItems(base, []);
  assert.equal(item, base[0]);
});
