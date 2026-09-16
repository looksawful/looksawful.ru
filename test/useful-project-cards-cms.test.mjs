import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Pages CMS exposes Useful editorial copy without release or media controls", async () => {
  const [cms, source] = await Promise.all([
    read(".pages.yml"),
    read("src/content/editorial/useful-project-cards.json").then(JSON.parse),
  ]);
  const start = cms.indexOf("  - name: useful-project-cards\n");
  const end = cms.indexOf("\n  - name: project-card-media\n", start);
  assert.notEqual(start, -1, "Useful copy must be exposed in Pages CMS");
  assert.notEqual(end, -1, "Useful CMS block must stay bounded");
  const block = cms.slice(start, end);
  assert.match(block, /path: src\/content\/editorial\/useful-project-cards\.json/);
  for (const id of ["awful-cases", "moves-awful", "berserk-timer", "awful-studio"]) {
    assert.match(block, new RegExp(`name: ${id}`));
    assert.ok(source.cards[id], `missing canonical copy for ${id}`);
  }
  for (const forbidden of ["href", "state", "visible", "coverEntryId", "badge"]) {
    assert.doesNotMatch(block, new RegExp(`name: ${forbidden}\\b`));
  }
});

import { classifyCmsPublicationPath } from "../tools/cms-publication-scope.mjs";

test("Useful editorial copy is authorized by the CMS publication boundary", () => {
  assert.equal(
    classifyCmsPublicationPath("src/content/editorial/useful-project-cards.json"),
    "CMS_CONTENT",
  );
});
