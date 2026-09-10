import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveMediaCatalogDisplayItems,
  deriveMediaCatalogItems,
} from "../src/data/media/catalog-view.ts";

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

test("video poster projection preserves manual posters and supplies orientation fallbacks", () => {
  const videoBase = [
    {
      ...base[0],
      asset: { id: "video-manual", type: "video", src: "/media/manual.mp4", width: 1920, height: 1080 },
    },
    {
      ...base[0],
      asset: { id: "poster-manual", type: "image", src: "/media/manual-poster.webp", width: 1920, height: 1080 },
    },
    {
      ...base[0],
      asset: { id: "video-landscape", type: "video", src: "/media/landscape.mp4", width: 1920, height: 1080 },
    },
    {
      ...base[0],
      asset: { id: "video-portrait", type: "video", src: "/media/portrait.mp4", width: 1080, height: 1920 },
    },
  ];

  const projected = deriveMediaCatalogItems(videoBase, [
    { assetId: "video-manual", posterAssetId: "poster-manual" },
    { assetId: "video-landscape" },
    { assetId: "video-portrait" },
  ]);
  const byId = new Map(projected.map((item) => [item.asset.id, item]));

  assert.equal(byId.get("video-manual").posterSrc, "/media/manual-poster.webp");
  assert.equal(byId.get("video-landscape").posterSrc, "/media/fallback/video-16x9.svg");
  assert.equal(byId.get("video-portrait").posterSrc, "/media/fallback/video-9x16.svg");
});

test("Media Desk display projection adds posters without replacing editable catalog metadata", () => {
  const videoBase = [{
    ...base[0],
    asset: { id: "video", type: "video", src: "/media/video.mp4", width: 1920, height: 1080 },
  }];

  const [item] = deriveMediaCatalogDisplayItems(videoBase, [{
    assetId: "video",
    title: "Usage title",
    alt: "Usage alt",
    description: "Usage description",
    posterAssetId: "missing-poster",
  }]);

  assert.equal(item.title, "Library title");
  assert.equal(item.alt, "Library alt");
  assert.equal(item.description, "Library description");
  assert.equal(item.posterSrc, "/media/fallback/video-16x9.svg");
});

test("every canonical video exposed by the catalog has a resolved poster", async () => {
  const { mediaCatalogItems } = await import("../src/data/media/catalog-view.ts");
  const videos = mediaCatalogItems.filter((item) => item.asset.type === "video");

  assert.ok(videos.length > 0);
  for (const video of videos) {
    assert.ok(video.posterSrc, `${video.asset.id} must resolve a poster`);
  }
});