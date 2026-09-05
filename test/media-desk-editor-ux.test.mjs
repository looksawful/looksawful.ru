import assert from "node:assert/strict";
import test from "node:test";

import {
  applyMediaEditorialPatchToItem,
  buildMediaEditorialPatch,
} from "../src/tools/media-desk/editor-serialization.ts";

test("media editor serialization preserves optional text and normalizes lists", () => {
  const patch = buildMediaEditorialPatch({
    title: "  Title  ",
    alt: "   ",
    description: "",
    date: " 2026 ",
    projectIds: ["p1", "p1", " p2 "],
    workAreaIds: ["w1"],
    projectTypeIds: [],
    deliverableIds: ["d1"],
    tags: [" fashion ", "fashion", "editorial"],
    credits: [" Photo: A ", "Photo: A", "Styling: B"],
    showInCatalog: true,
    reusable: true,
    archived: false,
  });

  assert.equal(patch.title, "Title");
  assert.equal(patch.alt, "");
  assert.equal(patch.description, "");
  assert.equal(patch.date, "2026");
  assert.deepEqual(patch.projectIds, ["p1", "p2"]);
  assert.deepEqual(patch.workAreaIds, ["w1"]);
  assert.deepEqual(patch.projectTypeIds, []);
  assert.deepEqual(patch.deliverableIds, ["d1"]);
  assert.deepEqual(patch.tags, ["fashion", "editorial"]);
  assert.deepEqual(patch.credits, ["Photo: A", "Styling: B"]);
  assert.equal(patch.showInCatalog, true);
  assert.equal(patch.reusable, true);
  assert.equal(patch.archived, false);
});

test("session editorial patch overlays catalog data without mutating canonical data", () => {
  const canonical = {
    origin: "registered",
    asset: { id: "asset-a", type: "image", src: "/a.webp" },
    title: "Old",
    alt: "Old alt",
    description: "Old description",
    date: "2025",
    projectIds: [],
    workAreaIds: [],
    projectTypeIds: [],
    deliverableIds: [],
    tags: ["old"],
    credits: [],
    showInCatalog: false,
    reusable: true,
    archived: false,
  };

  const patch = buildMediaEditorialPatch({
    ...canonical,
    title: "New",
    tags: ["new"],
    projectIds: ["project-a"],
    showInCatalog: true,
  });

  const current = applyMediaEditorialPatchToItem(canonical, patch);

  assert.equal(current.title, "New");
  assert.deepEqual(current.tags, ["new"]);
  assert.deepEqual(current.projectIds, ["project-a"]);
  assert.equal(current.showInCatalog, true);
  assert.equal(current.asset, canonical.asset);
  assert.equal(canonical.title, "Old");
  assert.deepEqual(canonical.tags, ["old"]);
  assert.equal(canonical.showInCatalog, false);
});
