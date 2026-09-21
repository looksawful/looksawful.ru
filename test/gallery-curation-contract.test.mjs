import assert from "node:assert/strict";
import test from "node:test";

import { resolveGalleryCuration } from "../src/data/media/gallery-curation.ts";

function item({
  id,
  type = "image",
  archived = false,
  posterSrc,
}) {
  return {
    origin: "registered",
    asset: {
      id,
      type,
      src: `/media/${id}.${type === "video" ? "mp4" : type === "model" ? "glb" : "webp"}`,
      ...(type === "image" ? { width: 1200, height: 800 } : {}),
      ...(type === "video" ? { width: 1280, height: 720 } : {}),
      ...(type === "model" ? { mimeType: "model/gltf-binary", byteLength: 1024 } : {}),
    },
    title: id,
    alt: `${id} alt`,
    description: "",
    date: "",
    projectIds: ["project-a"],
    workAreaIds: [],
    projectTypeIds: [],
    deliverableIds: [],
    tags: [],
    credits: [],
    showInCatalog: false,
    reusable: true,
    archived,
    ...(posterSrc ? { posterSrc } : {}),
  };
}

const catalog = [
  item({ id: "image-a" }),
  item({ id: "image-b" }),
  item({ id: "image-c" }),
  item({ id: "video-a", type: "video", posterSrc: "/media/video-a-poster.webp" }),
  item({ id: "model-a", type: "model" }),
  item({ id: "model-poster" }),
  item({ id: "archived-a", archived: true }),
];

test("Gallery curation resolves mixed canonical media in explicit series order", () => {
  const resolved = resolveGalleryCuration([
    {
      id: "project-a-main",
      projectId: "project-a",
      placements: [
        { assetId: "image-a", featured: true },
        { assetId: "video-a" },
        { assetId: "model-a", posterAssetId: "model-poster" },
      ],
    },
  ], catalog);

  assert.deepEqual(
    resolved.map((placement) => ({
      itemId: placement.itemId,
      seriesId: placement.seriesId,
      seriesOrder: placement.seriesOrder,
      itemOrder: placement.itemOrder,
      featured: placement.featured,
      kind: placement.media[0].kind,
      posterSrc: placement.media[0].posterSrc,
    })),
    [
      {
        itemId: "image-a",
        seriesId: "project-a-main",
        seriesOrder: 0,
        itemOrder: 0,
        featured: true,
        kind: "image",
        posterSrc: "/media/image-a.webp",
      },
      {
        itemId: "video-a",
        seriesId: "project-a-main",
        seriesOrder: 0,
        itemOrder: 1,
        featured: false,
        kind: "video",
        posterSrc: "/media/video-a-poster.webp",
      },
      {
        itemId: "model-a",
        seriesId: "project-a-main",
        seriesOrder: 0,
        itemOrder: 2,
        featured: false,
        kind: "model",
        posterSrc: "/media/model-poster.webp",
      },
    ],
  );
});

test("Gallery document-like placement stays one canonical item with ordered canonical slides", () => {
  const [placement] = resolveGalleryCuration([
    {
      id: "project-a-pages",
      projectId: "project-a",
      placements: [
        {
          assetId: "image-a",
          slideAssetIds: ["image-b", "image-c"],
        },
      ],
    },
  ], catalog);

  assert.equal(placement.itemId, "image-a");
  assert.deepEqual(placement.media.map(({ assetId }) => assetId), ["image-a", "image-b", "image-c"]);
});

test("Gallery curation rejects duplicate canonical media identity across placements and slides", () => {
  assert.throws(
    () => resolveGalleryCuration([
      {
        id: "project-a-main",
        projectId: "project-a",
        placements: [
          { assetId: "image-a", slideAssetIds: ["image-b"] },
          { assetId: "image-b" },
        ],
      },
    ], catalog),
    /duplicate canonical asset "image-b"/i,
  );
});

test("Gallery curation enforces featured editorial invariants", () => {
  assert.throws(
    () => resolveGalleryCuration([
      {
        id: "too-many-featured",
        projectId: "project-a",
        placements: [
          { assetId: "image-a", featured: true },
          { assetId: "image-b", featured: true },
          { assetId: "image-c", featured: true },
        ],
      },
    ], catalog),
    /at most 2 featured/i,
  );

  assert.throws(
    () => resolveGalleryCuration([
      {
        id: "late-featured",
        projectId: "project-a",
        placements: [
          { assetId: "image-a" },
          { assetId: "image-b", featured: true },
        ],
      },
    ], catalog),
    /first placement must be featured/i,
  );
});

test("Gallery curation rejects unknown, archived, and unrenderable canonical media", () => {
  assert.throws(
    () => resolveGalleryCuration([
      { id: "unknown", projectId: "project-a", placements: [{ assetId: "missing" }] },
    ], catalog),
    /unknown canonical asset "missing"/i,
  );

  assert.throws(
    () => resolveGalleryCuration([
      { id: "archived", projectId: "project-a", placements: [{ assetId: "archived-a" }] },
    ], catalog),
    /archived canonical asset "archived-a"/i,
  );

  assert.throws(
    () => resolveGalleryCuration([
      { id: "model-no-poster", projectId: "project-a", placements: [{ assetId: "model-a" }] },
    ], catalog),
    /model "model-a".*poster/i,
  );

  assert.throws(
    () => resolveGalleryCuration([
      {
        id: "video-no-poster",
        projectId: "project-a",
        placements: [{ assetId: "video-b" }],
      },
    ], [...catalog, item({ id: "video-b", type: "video" })]),
    /video "video-b".*poster/i,
  );
});
