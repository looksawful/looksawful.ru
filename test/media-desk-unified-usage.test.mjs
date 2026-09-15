import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMediaDeskInventoryIndex,
  filterMediaDeskInventoryRecords,
} from "../src/devtools/media-desk/inventory-model.ts";
import {
  galleryUsages,
  mediaEntryUsages,
  petCoverUsages,
  projectCoverUsages,
} from "../src/devtools/media-desk/usage-sources.ts";

function item(id, src, overrides = {}) {
  return {
    origin: "registered",
    asset: { id, type: "image", src, width: 1200, height: 800 },
    title: id,
    alt: `${id} alt`,
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

test("one canonical asset accumulates gallery, cover, poster and direct placement usages", () => {
  const items = [
    item("hero", "/media/hero.webp", { showInCatalog: true }),
    item("video", "/media/video.mp4", { asset: { id: "video", type: "video", src: "/media/video.mp4" } }),
    item("unused", "/media/unused.webp"),
  ];
  const entries = [
    { id: "pet-cover-entry", assetId: "hero" },
    { id: "video-entry", assetId: "video", posterAssetId: "hero" },
  ];
  const projectCards = [
    { id: "jestei", pageId: "case:jestei-pool", visible: true, cover: { src: "/media/hero.webp", alt: "", width: 1200, height: 800 } },
  ];
  const petCards = [
    { id: "awful-cases", title: "Awful Cases", description: "", coverEntryId: "pet-cover-entry", shape: "landscape", href: "/work/awful-cases/", source: "site" },
  ];

  const bindings = [
    ...galleryUsages(items),
    ...mediaEntryUsages(entries),
    ...projectCoverUsages(projectCards, items),
    ...petCoverUsages(petCards, entries),
  ];
  const records = buildMediaDeskInventoryIndex(items, entries, bindings);
  const hero = records.find(({ assetId }) => assetId === "hero");

  assert.deepEqual(
    hero?.usages.map(({ kind }) => kind),
    ["gallery", "project-cover", "pet-cover", "video-poster", "direct-placement"],
  );
  assert.ok(hero?.usages.every(({ blockingDelete }) => blockingDelete));
  assert.equal(hero?.diagnostics.includes("orphan"), false);
  assert.deepEqual(records.find(({ assetId }) => assetId === "unused")?.diagnostics, ["orphan"]);
});

test("usage provenance participates in inventory search", () => {
  const items = [item("cover", "/media/cover.webp")];
  const records = buildMediaDeskInventoryIndex(items, [], [
    {
      assetId: "cover",
      usage: {
        kind: "pet-cover",
        ownerId: "awful-cases",
        sourcePath: "src/data/subproject-cards.ts",
        fieldPath: "awful-cases.coverEntryId",
        route: "/work/awful-cases/",
        blockingDelete: true,
      },
    },
  ]);

  assert.deepEqual(
    filterMediaDeskInventoryRecords(records, { search: "awful-cases" }).map(({ assetId }) => assetId),
    ["cover"],
  );
  assert.deepEqual(
    filterMediaDeskInventoryRecords(records, { search: "pet-cover" }).map(({ assetId }) => assetId),
    ["cover"],
  );
});

test("project cover adapter fails closed instead of inventing an asset for an unregistered path", () => {
  const cards = [
    { id: "missing", pageId: "case:jestei-pool", visible: true, cover: { src: "/media/not-registered.webp", alt: "", width: 1, height: 1 } },
  ];

  assert.throws(
    () => projectCoverUsages(cards, [item("known", "/media/known.webp")]),
    /unresolved project cover/i,
  );
});
