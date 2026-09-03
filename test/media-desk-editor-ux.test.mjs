import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  applyMediaEditorialPatchToItem,
  buildMediaEditorialPatch,
} from "../src/tools/media-desk/editor-serialization.ts";

const editorSource = await readFile(new URL("../src/tools/media-desk/editor.ts", import.meta.url), "utf8");
const editorCss = await readFile(new URL("../src/tools/media-desk/editor.css", import.meta.url), "utf8");

test("media editor serialization preserves empty optional text and normalizes lists", () => {
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
  assert.equal(patch.reusable, true);
  assert.equal(patch.archived, false);
});

test("session editorial patch overlays a catalog item without mutating canonical data", () => {
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
    reusable: true,
    archived: false,
  };
  const patch = buildMediaEditorialPatch({
    ...canonical,
    title: "New",
    tags: ["new"],
    projectIds: ["project-a"],
  });
  const current = applyMediaEditorialPatchToItem(canonical, patch);

  assert.equal(current.title, "New");
  assert.deepEqual(current.tags, ["new"]);
  assert.deepEqual(current.projectIds, ["project-a"]);
  assert.equal(current.asset, canonical.asset);
  assert.equal(canonical.title, "Old");
  assert.deepEqual(canonical.tags, ["old"]);
});

test("media editor uses persistent inspector events, Tom Select and save without reload", () => {
  assert.match(editorSource, /#media-desk-inspector/);
  assert.match(editorSource, /media-desk:asset-select/);
  assert.match(editorSource, /media-desk:selection-change/);
  assert.match(editorSource, /media-desk:metadata-saved/);
  assert.match(editorSource, /editorialOverrides\.set\(item\.asset\.id, next\)/);
  assert.match(editorSource, /currentEditorItem\(canonical\)/);
  assert.match(editorSource, /new TomSelect/);
  assert.match(editorSource, /create: true/);
  assert.match(editorSource, /fetch\("\/__media-desk\/metadata"/);
  assert.doesNotMatch(editorSource, /location\.reload|window\.location\.reload/);
  assert.doesNotMatch(editorSource, /select\.multiple\s*=\s*true[\s\S]*?selectedOptions/);
});

test("open inspector overrides browser mobile hiding through 899px", () => {
  assert.match(editorCss, /@media\(max-width:899px\)/);
  assert.match(editorCss, /#media-desk-inspector\[data-open="true"\]\{display:block!important;position:fixed/);
  assert.match(editorCss, /block-size:100dvh/);
});

test("technical metadata remains read only presentation", () => {
  assert.match(editorSource, /technicalSection\(item/);
  assert.match(editorSource, /Asset ID/);
  assert.match(editorSource, /Dimensions/);
  assert.match(editorSource, /Duration/);
  assert.match(editorSource, /MIME/);
  assert.match(editorSource, /Bytes/);
  assert.doesNotMatch(editorSource, /name:\s*["'](?:width|height|durationSeconds|mimeType|byteLength|src)["']/);
});
