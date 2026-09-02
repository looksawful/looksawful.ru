import assert from "node:assert/strict";
import test from "node:test";

import {
  filterAndSortMediaDeskItems,
  getMediaDeskIssues,
  mediaDeskCompleteness,
} from "../src/tools/media-desk/model.ts";

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
