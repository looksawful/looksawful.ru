import assert from "node:assert/strict";
import test from "node:test";

import {
  filterAndSortMediaDeskItems,
  getMediaDeskIssues,
  mediaDeskCompleteness,
} from "../src/devtools/media-desk/model.ts";
import {
  buildMediaDeskInventoryIndex,
  filterMediaDeskInventoryRecords,
  summarizeMediaDeskDiagnostics,
} from "../src/devtools/media-desk/inventory-model.ts";

const projectNames = new Map([
  ["project-a", "Alpha Project"],
  ["project-b", "Beta Project"],
]);

function item(overrides = {}) {
  return {
    origin: "registered",
    asset: { id: "asset-a", type: "image", src: "/media/a.webp", width: 1200, height: 800 },
    title: "Alpha image",
    alt: "Alpha alt",
    description: "Alpha description",
    date: "2026-01-02",
    projectIds: ["project-a"],
    workAreaIds: ["photography"],
    projectTypeIds: ["editorial"],
    deliverableIds: ["lookbook"],
    tags: ["fashion"],
    credits: ["Photographer: Example"],
    reusable: true,
    archived: false,
    ...overrides,
  };
}

test("media desk search includes project labels, tags and asset ids", () => {
  const items = [
    item(),
    item({
      asset: { id: "asset-b", type: "video", src: "/media/b.mp4" },
      title: "Second item",
      projectIds: ["project-b"],
      tags: ["motion"],
    }),
  ];

  assert.deepEqual(
    filterAndSortMediaDeskItems(items, { search: "beta project" }, projectNames).map(({ asset }) => asset.id),
    ["asset-b"],
  );
  assert.deepEqual(
    filterAndSortMediaDeskItems(items, { search: "fashion" }, projectNames).map(({ asset }) => asset.id),
    ["asset-a"],
  );
  assert.deepEqual(
    filterAndSortMediaDeskItems(items, { search: "asset-b" }, projectNames).map(({ asset }) => asset.id),
    ["asset-b"],
  );
});

test("media desk filters compose across type, project and review state", () => {
  const items = [
    item(),
    item({
      asset: { id: "asset-b", type: "video", src: "/media/b.mp4" },
      title: "Incomplete video",
      alt: "",
      description: "",
      projectIds: ["project-b"],
    }),
  ];

  const result = filterAndSortMediaDeskItems(
    items,
    { mediaType: "video", projectId: "project-b", review: "needs-review" },
    projectNames,
  );

  assert.deepEqual(result.map(({ asset }) => asset.id), ["asset-b"]);
});

test("review issues are derived and do not add another source of truth", () => {
  const candidate = item({ alt: "", description: "", projectIds: [] });

  assert.deepEqual(getMediaDeskIssues(candidate), ["missing-alt", "missing-description", "missing-project"]);
  assert.ok(mediaDeskCompleteness(candidate) < mediaDeskCompleteness(item()));
});

test("completeness sorting places better-described records first", () => {
  const complete = item({ asset: { id: "complete", type: "image", src: "/media/complete.webp" } });
  const incomplete = item({
    asset: { id: "incomplete", type: "image", src: "/media/incomplete.webp" },
    alt: "",
    description: "",
    projectIds: [],
    workAreaIds: [],
    tags: [],
    credits: [],
  });

  const result = filterAndSortMediaDeskItems(
    [incomplete, complete],
    { sort: "completeness-desc" },
    projectNames,
  );

  assert.deepEqual(result.map(({ asset }) => asset.id), ["complete", "incomplete"]);
});

test("inventory index derives direct/poster placement usage without changing canonical items", () => {
  const items = [
    item(),
    item({ asset: { id: "asset-b", type: "image", src: "/media/b.webp" }, title: "Beta" }),
    item({ asset: { id: "poster-a", type: "image", src: "/media/poster.webp" }, title: "Poster" }),
  ];
  const entries = [
    { id: "section-a-use-01", assetId: "asset-a", projectIds: ["project-a"], posterAssetId: "poster-a" },
    { id: "section-b-use-01", assetId: "asset-a", projectIds: ["project-b"] },
  ];

  const records = buildMediaDeskInventoryIndex(items, entries);
  const assetA = records.find((record) => record.assetId === "asset-a");
  const poster = records.find((record) => record.assetId === "poster-a");

  assert.equal(assetA?.usage.direct, 2);
  assert.equal(assetA?.usage.poster, 0);
  assert.deepEqual(assetA?.usage.entryIds, ["section-a-use-01", "section-b-use-01"]);
  assert.deepEqual(assetA?.usage.projectIds, ["project-a", "project-b"]);
  assert.equal(poster?.usage.direct, 0);
  assert.equal(poster?.usage.poster, 1);
  assert.deepEqual(items[0].projectIds, ["project-a"]);
});

test("inventory diagnostics deterministically classify orphan, missing source and duplicate paths", () => {
  const items = [
    item(),
    item({ asset: { id: "asset-b", type: "image", src: "/media/a.webp" }, title: "Duplicate path" }),
    item({ asset: { id: "asset-c", type: "image", src: "" }, title: "Missing source" }),
  ];
  const entries = [{ id: "used-a", assetId: "asset-a", projectIds: ["project-a"] }];

  const records = buildMediaDeskInventoryIndex(items, entries);
  const summary = summarizeMediaDeskDiagnostics(records);

  assert.deepEqual(records.find(({ assetId }) => assetId === "asset-a")?.diagnostics, ["duplicate-path"]);
  assert.deepEqual(records.find(({ assetId }) => assetId === "asset-b")?.diagnostics, ["orphan", "duplicate-path"]);
  assert.deepEqual(records.find(({ assetId }) => assetId === "asset-c")?.diagnostics, ["orphan", "missing-source"]);
  assert.deepEqual(summary, {
    orphan: 2,
    "missing-source": 1,
    "duplicate-id": 0,
    "duplicate-path": 2,
  });
});

test("inventory filters compose search, usage and diagnostic state", () => {
  const items = [
    item(),
    item({
      asset: { id: "asset-b", type: "image", src: "/media/b.webp" },
      title: "Beta placement",
      projectIds: ["project-b"],
    }),
  ];
  const entries = [{ id: "styx-lookbook-hero", assetId: "asset-b", projectIds: ["project-b"] }];
  const records = buildMediaDeskInventoryIndex(items, entries);

  assert.deepEqual(
    filterMediaDeskInventoryRecords(records, { search: "styx-lookbook", usage: "used", diagnostic: "all" })
      .map(({ assetId }) => assetId),
    ["asset-b"],
  );
  assert.deepEqual(
    filterMediaDeskInventoryRecords(records, { usage: "orphan", diagnostic: "orphan" })
      .map(({ assetId }) => assetId),
    ["asset-a"],
  );
});
