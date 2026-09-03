import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

const bulkSource = await readFile(new URL("../src/tools/media-desk/bulk-editor.ts", import.meta.url), "utf8");
const editorSource = await readFile(new URL("../src/tools/media-desk/editor.ts", import.meta.url), "utf8");

test("bulk array operations add, remove, replace and dedupe", () => {
  assert.deepEqual(applyBulkArrayOperation(["a", "b"], "add", [" b ", "c", "c"]), ["a", "b", "c"]);
  assert.deepEqual(applyBulkArrayOperation(["a", "b", "c"], "remove", ["b", "missing"]), ["a", "c"]);
  assert.deepEqual(applyBulkArrayOperation(["a"], "set", [" x ", "x", "y"]), ["x", "y"]);
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

test("batch request respects different current asset states and leaves canonical items untouched", () => {
  const first = { origin: "registered", asset: { id: "a", type: "image", src: "/a.jpg" }, ...structuredClone(base) };
  const second = {
    origin: "registered",
    asset: { id: "b", type: "image", src: "/b.jpg" },
    ...structuredClone(base),
    projectIds: ["two"],
    tags: ["other"],
    reusable: true,
  };
  const originals = structuredClone([first, second]);
  const batch = buildBulkMetadataRequest([first, second], {
    arrays: [
      { field: "projectIds", mode: "add", values: ["three"] },
      { field: "tags", mode: "set", values: ["bulk", "bulk"] },
    ],
    archived: true,
  });

  assert.deepEqual([first, second], originals);
  assert.deepEqual(batch[0].metadata.projectIds, ["one", "three"]);
  assert.deepEqual(batch[1].metadata.projectIds, ["two", "three"]);
  assert.deepEqual(batch[0].metadata.tags, ["bulk"]);
  assert.deepEqual(batch[1].metadata.tags, ["bulk"]);
  assert.equal(batch[0].metadata.reusable, false);
  assert.equal(batch[1].metadata.reusable, true);
  assert.equal(batch[0].metadata.archived, true);
  assert.equal(batch[1].metadata.archived, true);
});

test("bulk UI uses direct batch endpoint, explicit semantics and event contracts", () => {
  assert.match(bulkSource, /\/__media-desk\/metadata\/bulk/);
  assert.match(bulkSource, /JSON\.stringify\(batch\)/);
  assert.match(bulkSource, /ADD/);
  assert.match(bulkSource, /REMOVE/);
  assert.match(bulkSource, /SET \/ REPLACE/);
  assert.match(bulkSource, /create: false/);
  assert.match(bulkSource, /create: true/);
  assert.match(bulkSource, /media-desk:selection-change/);
  assert.match(bulkSource, /media-desk:selection-clear/);
  assert.match(bulkSource, /media-desk:metadata-saved/);
  assert.doesNotMatch(bulkSource, /location\.reload|window\.location\.reload/);
});

test("single editor cache listens to metadata-saved so bulk updates stay current", () => {
  assert.match(editorSource, /addEventListener\("media-desk:metadata-saved"/);
  assert.match(editorSource, /editorialOverrides\.set\(detail\.id, detail\.metadata\)/);
  assert.match(editorSource, /connectMediaDeskBulkEditor\(\)/);
});

test("active persistent inspector refreshes external saved metadata without dropping drafts", () => {
  assert.match(editorSource, /const rebuild = \(id: string\): void =>/);
  assert.match(editorSource, /active\?\.destroy\(\);[\s\S]*active = buildMediaEditor\(currentEditorItem\(canonical\)\);[\s\S]*renderEditor\(inspector, active, true\)/);
  assert.match(editorSource, /detail\.origin === "single"/);
  assert.match(editorSource, /active\?\.item\.asset\.id !== detail\.id \|\| active\.getState\(\) !== "saved"/);
  assert.match(editorSource, /if \(active\?\.item\.asset\.id === id\) \{[\s\S]*active\.getState\(\) === "unsaved"[\s\S]*rebuild\(id\)/);
  assert.match(editorSource, /detail: \{ id: item\.asset\.id, metadata: next, origin: "single" \}/);

  const metadataListener = editorSource.match(
    /document\.addEventListener\("media-desk:metadata-saved", \(event\) => \{[\s\S]*?\n  \}\);/g,
  );
  assert.ok(metadataListener && metadataListener.length >= 2);
  assert.doesNotMatch(metadataListener.at(-1), /dispatchEvent\(new CustomEvent\("media-desk:metadata-saved"/);
});
