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
  title: "Library title",
  alt: "Library alt",
  description: "Library description",
  date: "2020",
  projectIds: ["library-project"],
  workAreaIds: ["graphic-design"],
  projectTypeIds: [],
  deliverableIds: [],
  tags: ["library-tag"],
  credits: [],
  reusable: true,
  archived: false,
}];

test("fully materialized usage context replaces contextual catalog defaults", () => {
  const entryA = {
    assetId: "shared",
    title: "Usage A",
    alt: "A",
    description: "Description A",
    date: "2024",
    projectIds: ["project-a"],
    workAreaIds: ["photography"],
    projectTypeIds: ["shooting"],
    deliverableIds: ["cover"],
    tags: ["tag-a"],
    credits: ["credit-a"],
  };
  const entryB = {
    assetId: "shared",
    title: "Usage B",
    alt: "B",
    description: "Description B",
    date: "2025",
    projectIds: ["project-b"],
    workAreaIds: ["production"],
    projectTypeIds: ["editorial"],
    deliverableIds: ["catalog"],
    tags: ["tag-b"],
    credits: ["credit-b"],
  };

  const [item] = deriveMediaCatalogItems(base, [entryA, entryB]);

  assert.equal(item.title, "Usage A");
  assert.equal(item.alt, "A");
  assert.equal(item.description, "Description A");
  assert.equal(item.date, "2024");
  assert.deepEqual(item.projectIds, ["project-a", "project-b"]);
  assert.deepEqual(item.workAreaIds, ["photography", "production"]);
  assert.deepEqual(item.projectTypeIds, ["shooting", "editorial"]);
  assert.deepEqual(item.deliverableIds, ["cover", "catalog"]);
  assert.deepEqual(item.tags, ["tag-a", "tag-b"]);
  assert.deepEqual(item.credits, ["credit-a", "credit-b"]);

  assert.deepEqual(entryA.projectIds, ["project-a"]);
  assert.deepEqual(entryB.projectIds, ["project-b"]);
});

test("incomplete migration keeps legacy catalog context only as a compatibility fallback", () => {
  const [item] = deriveMediaCatalogItems(base, [{
    assetId: "shared",
    projectIds: ["project-a"],
  }]);

  assert.deepEqual(item.projectIds, ["project-a"]);
  assert.deepEqual(item.tags, ["library-tag"]);
  assert.equal(item.title, "Library title");
});

test("asset with no usage preserves the library catalog item", () => {
  const [item] = deriveMediaCatalogItems(base, []);
  assert.equal(item, base[0]);
});
