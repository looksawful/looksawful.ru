import assert from "node:assert/strict";
import test from "node:test";

import { analyzeTextDeskEntries, filterTextDeskEntries } from "../src/tools/media-desk/text-analysis.ts";
import { analyzeMediaDeskItems } from "../src/tools/media-desk/media-analysis.ts";

const textEntries = [
  { sourcePath: "src/content/a.json", fieldPath: "title", value: "Hello world repeated" },
  { sourcePath: "src/content/a.json", fieldPath: "description", value: "" },
  { sourcePath: "src/content/b.json", fieldPath: "title", value: "Hello world repeated" },
  { sourcePath: "src/content/b.json", fieldPath: "body", value: "Longer editorial value here" },
];

test("text analysis covers filtering, source counts, empties, lengths and repeats", () => {
  assert.deepEqual(filterTextDeskEntries(textEntries, { query: "longer" }).map(({ fieldPath }) => fieldPath), ["body"]);
  assert.equal(filterTextDeskEntries(textEntries, { sourcePath: "src/content/a.json" }).length, 2);
  const analysis = analyzeTextDeskEntries(textEntries);
  assert.equal(analysis.totalEntries, 4);
  assert.equal(analysis.uniqueSources, 2);
  assert.equal(analysis.emptyValues, 1);
  assert.equal(analysis.entriesPerSource[0].count, 2);
  assert.equal(analysis.longestValues[0].entry.fieldPath, "body");
  assert.deepEqual(analysis.repeatedValues, [{ value: "Hello world repeated", count: 2 }]);
  assert.ok(analysis.averageLength > 0);
  assert.ok(analysis.medianLength > 0);
});

test("text analysis handles an empty dataset", () => {
  const analysis = analyzeTextDeskEntries([]);
  assert.equal(analysis.totalEntries, 0);
  assert.equal(analysis.uniqueSources, 0);
  assert.equal(analysis.emptyValues, 0);
  assert.equal(analysis.averageLength, 0);
  assert.equal(analysis.medianLength, 0);
  assert.deepEqual(analysis.entriesPerSource, []);
});

function media(overrides = {}) {
  return {
    origin: "registered",
    asset: { id: "asset", type: "image", src: "/asset.webp" },
    title: "Asset",
    alt: "Alt",
    description: "Description",
    date: "2026",
    projectIds: ["project-a"],
    workAreaIds: ["design"],
    projectTypeIds: [],
    deliverableIds: [],
    tags: ["tag"],
    credits: ["Credit"],
    reusable: true,
    archived: false,
    ...overrides,
  };
}

test("media analysis reuses review/completeness contracts and totals known bytes", () => {
  const items = [
    media({ asset: { id: "image", type: "image", src: "/image.webp" }, byteLength: 100 }),
    media({ asset: { id: "video", type: "video", src: "/video.mp4" }, alt: "", description: "", projectIds: [], reusable: false, byteLength: 300 }),
    media({ asset: { id: "model", type: "model", src: "/model.glb" }, archived: true, byteLength: 200 }),
  ];
  const analysis = analyzeMediaDeskItems(items);
  assert.equal(analysis.total, 3);
  assert.equal(analysis.imageCount, 1);
  assert.equal(analysis.videoCount, 1);
  assert.equal(analysis.modelCount, 1);
  assert.equal(analysis.archived, 1);
  assert.equal(analysis.reusable, 2);
  assert.equal(analysis.missingAlt, 1);
  assert.equal(analysis.missingDescription, 1);
  assert.equal(analysis.missingProject, 1);
  assert.equal(analysis.needsReview, 1);
  assert.equal(analysis.knownTotalByteLength, 600);
  assert.equal(analysis.largestAssets[0].id, "video");
  assert.equal(analysis.projects[0].projectId, "project-a");
});

test("media analysis handles empty items", () => {
  const analysis = analyzeMediaDeskItems([]);
  assert.equal(analysis.total, 0);
  assert.equal(analysis.knownTotalByteLength, 0);
  assert.equal(analysis.averageCompleteness, 0);
  assert.deepEqual(analysis.largestAssets, []);
  assert.deepEqual(analysis.projects, []);
});
