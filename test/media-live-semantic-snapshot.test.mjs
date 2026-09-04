import assert from "node:assert/strict";
import test from "node:test";

import {
  compareSemanticSnapshots,
  semanticEntryRecord,
} from "../tools/media/live-semantic-snapshot.mjs";

test("semantic snapshot includes all contextual usage fields", () => {
  const record = semanticEntryRecord({
    id: "entry-a",
    assetId: "asset-a",
    title: "Title",
    alt: "",
    description: "Description",
    date: "2026",
    projectIds: ["project-a"],
    workAreaIds: ["photography"],
    projectTypeIds: ["shooting"],
    deliverableIds: ["cover"],
    tags: ["tag-a"],
    credits: ["credit-a"],
    caption: { title: "Caption" },
    purpose: "work",
  }, { type: "image", src: "/media/a.webp" });

  assert.deepEqual(record.projectIds, ["project-a"]);
  assert.deepEqual(record.workAreaIds, ["photography"]);
  assert.deepEqual(record.projectTypeIds, ["shooting"]);
  assert.deepEqual(record.deliverableIds, ["cover"]);
  assert.deepEqual(record.tags, ["tag-a"]);
  assert.deepEqual(record.credits, ["credit-a"]);
  assert.equal(record.title, "Title");
  assert.equal(record.description, "Description");
});

test("semantic snapshot comparison pinpoints changed entry fields", () => {
  const before = { entries: [{ id: "entry-a", projectIds: ["a"], title: "A" }] };
  const after = { entries: [{ id: "entry-a", projectIds: ["b"], title: "A" }] };
  const mismatches = compareSemanticSnapshots(after, before);

  assert.equal(mismatches.length, 1);
  assert.equal(mismatches[0].entryId, "entry-a");
});
