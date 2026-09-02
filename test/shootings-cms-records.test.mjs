import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import {
  shootingsEsmiIntro,
  shootingsEvashaIntro,
  shootingsHypressionIntro,
  shootingsIgguanaIntro,
  shootingsIntro,
  shootingsObladaetIntro,
  shootingsOfeliaIntro,
} from "../src/data/content/shootings.ts";
import { shootingsProjects } from "../src/data/catalog/projects/shootings.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { renderSectionIntro } from "../src/templates/section-intro.ts";

const overviewPath = "src/content/collections/shootings.json";
const recordsPath = "src/content/shootings";

const expectedIds = [
  "shootings-obladaet",
  "shootings-evasha",
  "shootings-igguana",
  "shootings-esmi",
  "shootings-hypression",
  "shootings-ofelia",
  "shootings-berry-model-tests",
  "shootings-berry-editorial",
  "shootings-berry-lookbook",
  "shootings-berry-product",
  "shootings-behance-ecobasik",
  "shootings-behance-offmi",
  "shootings-behance-cinema-stills-2",
  "shootings-behance-anka-model-tests",
  "shootings-behance-choose-your-character",
  "shootings-behance-editorial-photography",
];

const clone = (value) => structuredClone(value);

async function readCmsOverview() {
  return JSON.parse(await readFile(overviewPath, "utf8"));
}

async function readCmsRecords() {
  const filenames = (await readdir(recordsPath)).filter((name) => name.endsWith(".json")).sort();
  const records = await Promise.all(
    filenames.map(async (filename) => JSON.parse(await readFile(`${recordsPath}/${filename}`, "utf8"))),
  );
  return { filenames, records };
}

function restoreCodeOwnedOrder(records) {
  return expectedIds.map((id) => {
    const record = records.find((candidate) => candidate.id === id);
    assert.ok(record, `Missing Shootings CMS record ${id}`);
    return record;
  });
}

test("Shootings CMS storage has one overview and one file per stable shooting record", async () => {
  assert.equal(existsSync(overviewPath), true, `${overviewPath} must exist`);
  assert.equal(existsSync(recordsPath), true, `${recordsPath} must exist`);

  const overview = await readCmsOverview();
  assert.deepEqual(Object.keys(overview).sort(), ["head", "title", "role", "summary", "lead"].sort());

  const { filenames, records } = await readCmsRecords();
  assert.deepEqual(filenames, expectedIds.map((id) => `${id}.json`).sort());

  for (const record of records) {
    assert.equal(`${record.id}.json`, filenames.find((filename) => filename === `${record.id}.json`));
  }
});

test("Shootings editorial parser is strict and restores code-owned record order", async () => {
  const {
    SHOOTING_RECORD_IDS,
    parseShootingEditorialRecord,
    parseShootingsOverview,
    shootingsEditorialRecords,
  } = await import("../src/data/content/shootings-editorial.ts");

  const overview = await readCmsOverview();
  const { records } = await readCmsRecords();
  const recordsInCodeOwnedOrder = restoreCodeOwnedOrder(records);

  assert.deepEqual(SHOOTING_RECORD_IDS, expectedIds);
  assert.deepEqual(shootingsEditorialRecords, recordsInCodeOwnedOrder);
  assert.deepEqual(parseShootingsOverview(clone(overview)), overview);

  const malformed = clone(recordsInCodeOwnedOrder[0]);
  malformed.layout = "masonry";
  assert.throws(() => parseShootingEditorialRecord(malformed), /unexpected|field|key/i);

  const unknown = clone(recordsInCodeOwnedOrder[0]);
  unknown.id = "shootings-unregistered";
  assert.throws(() => parseShootingEditorialRecord(unknown), /unknown|id/i);

  const whitespace = clone(recordsInCodeOwnedOrder[0]);
  whitespace.title = "   ";
  assert.equal(parseShootingEditorialRecord(whitespace).title, "");

  const missingRenderedDescription = clone(recordsInCodeOwnedOrder[0]);
  delete missingRenderedDescription.description;
  assert.equal(parseShootingEditorialRecord(missingRenderedDescription).description, "");

  const missingOverviewCopy = clone(overview);
  delete missingOverviewCopy.title;
  assert.equal(parseShootingsOverview(missingOverviewCopy).title, "");

  const invalidCopy = clone(recordsInCodeOwnedOrder[0]);
  invalidCopy.description = 42;
  assert.throws(() => parseShootingEditorialRecord(invalidCopy), /string/i);
});

test("Shootings CMS data flows through the current catalog and rendered copy", async () => {
  const overview = await readCmsOverview();
  const { records } = await readCmsRecords();
  const recordsInCodeOwnedOrder = restoreCodeOwnedOrder(records);

  assert.deepEqual(
    shootingsProjects.map(({ id, name, date }) => ({ id, title: name, date: date ?? "" })),
    recordsInCodeOwnedOrder.map(({ id, title, date }) => ({ id, title, date })),
  );

  const renderedOverview = renderProjectIntro(shootingsIntro);
  for (const text of Object.values(overview)) {
    assert.ok(renderedOverview.includes(text), `Rendered Shootings overview must contain current CMS value: ${text}`);
  }

  const renderedSections = [
    shootingsObladaetIntro,
    shootingsEvashaIntro,
    shootingsIgguanaIntro,
    shootingsEsmiIntro,
    shootingsHypressionIntro,
    shootingsOfeliaIntro,
  ].map((section) => renderSectionIntro(section));

  for (const [index, record] of recordsInCodeOwnedOrder.slice(0, 6).entries()) {
    assert.ok(renderedSections[index].includes(record.title));
    assert.ok(renderedSections[index].includes(record.description));
  }
});

test("Pages CMS exposes Shootings records without architecture or presentation controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const marker = "\n  - name: shootings\n";
  const start = cms.indexOf(marker);
  assert.notEqual(start, -1, "Shootings CMS group must exist");
  const rest = cms.slice(start + 1);
  const nextEntry = rest.indexOf("\n  - name: ", marker.length - 1);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  assert.match(config, /type: group/);
  assert.match(config, /path: src\/content\/collections\/shootings\.json/);
  assert.match(config, /type: collection/);
  assert.match(config, /path: src\/content\/shootings/);
  assert.match(config, /primary: title/);
  assert.match(config, /create: false/);
  assert.match(config, /rename: false/);
  assert.match(config, /delete: false/);

  for (const field of ["head", "title", "role", "summary", "lead", "id", "date", "description"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of [
    "route",
    "canonical",
    "href",
    "indexable",
    "listed",
    "renderer",
    "entryId",
    "className",
    "layout",
    "captionView",
    "surfaceDeck",
    "filter",
  ]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
