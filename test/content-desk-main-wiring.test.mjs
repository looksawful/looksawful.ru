import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainSource = await readFile(new URL("../src/tools/media-desk/main.ts", import.meta.url), "utf8");

test("main owns text workspace wiring without parallel legacy bootstrap", () => {
  assert.match(mainSource, /renderContentDeskTextView/);
  assert.match(mainSource, /renderContentDeskTextView\(app\)/);
  assert.match(mainSource, /app\.classList\.remove\("media-desk"\)/);
  assert.match(mainSource, /workspace\.hidden = true/);
});

test("main wires analysis filter into the existing review state and render flow", () => {
  assert.match(mainSource, /MEDIA_ANALYSIS_FILTER_EVENT/);
  assert.match(mainSource, /analyzeMediaDeskItems\(sessionItems\)/);
  assert.match(mainSource, /state\.review = intent/);
  assert.match(mainSource, /reviewSelect\.value = state\.review/);
  assert.match(mainSource, /renderAfterControlChange\(\)/);
});

test("main owns browser selection clear and inspector asset select contracts", () => {
  assert.match(mainSource, /media-desk:selection-clear/);
  assert.match(mainSource, /selectedIds\.clear\(\)/);
  assert.match(mainSource, /updateSelectionDom\(\)/);
  assert.match(mainSource, /dispatchSelection\(\)/);
  assert.match(mainSource, /media-desk:asset-select/);
});

test("metadata saves update session presentation without reload", () => {
  assert.match(mainSource, /media-desk:metadata-saved/);
  assert.match(mainSource, /metadataOverrides\.set\(detail\.id/);
  assert.match(mainSource, /renderBrowser\(\)/);
  assert.doesNotMatch(mainSource, /location\.reload|window\.location\.reload/);
});

test("workspace CSS is explicitly connected from main", () => {
  for (const stylesheet of ["media-desk.css", "editor.css", "bulk-editor.css", "text-desk.css"]) {
    assert.equal(mainSource.includes(`import "./${stylesheet}";`), true, `${stylesheet} must be imported by main`);
  }
});
