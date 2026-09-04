import assert from "node:assert/strict";
import test from "node:test";

import {
  applyBulkArrayOperation,
  applyBulkEditorialPlan,
  buildBulkMetadataRequest,
} from "../src/tools/media-desk/bulk-editor-model.ts";

const base = {
  title: "Asset",
  alt: "",
  description: "",
  date: "",
  projectIds: ["one"],
  workAreaIds: [],
  projectTypeIds: [],
  deliverableIds: [],
  tags: ["old", "shared"],
  credits: ["Photo: A"],
  reusable: false,
  archived: false,
};

test("bulk array operations add, remove, replace and dedupe", () => {
  assert.deepEqual(
    applyBulkArrayOperation(["a", "b"], "add", [" b ", "c", "c"]),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    applyBulkArrayOperation(["a", "b", "c"], "remove", ["b", "missing"]),
    ["a", "c"],
  );
  assert.deepEqual(
    applyBulkArrayOperation(["a"], "set", [" x ", "x", "y"]),
    ["x", "y"],
  );
});

test("bulk editorial plan applies arrays and booleans without mutating current metadata", () => {
  const current = structuredClone(base);
  const snapshot = structuredClone(current);

  const next = applyBulkEditorialPlan(current, {
    arrays: [
      { field: "projectIds", mode: "add", values: ["two"] },
      { field: "tags", mode: "remove", values: ["old"] },
    ],
    reusable: true,
    archived: true,
  });

  assert.deepEqual(current, snapshot);
  assert.deepEqual(next.projectIds, ["one", "two"]);
  assert.deepEqual(next.tags, ["shared"]);
  assert.equal(next.reusable, true);
  assert.equal(next.archived, true);
  assert.deepEqual(next.credits, ["Photo: A"]);
});

test("batch request keeps registered project membership out of writes while editing uploads", () => {
  const registered = {
    origin: "registered",
    asset: { id: "a", type: "image", src: "/a.jpg" },
    ...structuredClone(base),
  };
  const uploaded = {
    origin: "cms",
    asset: { id: "cms-11111111-1111-4111-8111-111111111111", type: "image", src: "/media/catalog/b.jpg" },
    ...structuredClone(base),
    projectIds: ["two"],
    tags: ["other"],
    reusable: true,
  };

  const originals = structuredClone([registered, uploaded]);

  const batch = buildBulkMetadataRequest([registered, uploaded], {
    arrays: [
      { field: "projectIds", mode: "add", values: ["three"] },
      { field: "tags", mode: "set", values: ["bulk", "bulk"] },
    ],
    archived: true,
  });

  assert.deepEqual([registered, uploaded], originals);
  assert.equal(Object.hasOwn(batch[0].metadata, "projectIds"), false);
  assert.deepEqual(batch[1].metadata.projectIds, ["two", "three"]);
  assert.deepEqual(batch[0].metadata.tags, ["bulk"]);
  assert.deepEqual(batch[1].metadata.tags, ["bulk"]);
  assert.equal(batch[0].metadata.reusable, false);
  assert.equal(batch[1].metadata.reusable, true);
  assert.equal(batch[0].metadata.archived, true);
  assert.equal(batch[1].metadata.archived, true);
});
