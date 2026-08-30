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

const expectedOverview = {
  head: "Shootings",
  title: "Shootings",
  role: "Фотограф",
  summary:
    "С 2017 года снимаю и продюсирую контент для музыкантов, музыкальных лейблов и брендов одежды, делаю обложки и публикую авторские работы в российских и европейских fashion- и арт-изданиях.",
  lead:
    "Ниже — мои фотографии, съёмки, которые я продюсировал, заказные микс-медиа из моих фотографий и снимков других авторов, а также дизайн на основе моих кадров — мой и других дизайнеров.",
};

const expectedRecords = [
  {
    id: "shootings-obladaet",
    title: "Obladaet",
    date: "2020–2022",
    description: "В 2020–2022 годах снимал для Obladaet портреты и делал коллажи, обложки и микс-медиа.",
  },
  {
    id: "shootings-evasha",
    title: "Evasha",
    date: "2025",
    description: "В 2025 году снял серию портретов для Evasha и ВК Музыки и сделал обложки и микс-медиа.",
  },
  {
    id: "shootings-igguana",
    title: "Igguana",
    date: "2023",
    description: "Обложка и серия микс-медиа работ для Igguana, 2023.",
  },
  {
    id: "shootings-esmi",
    title: "ESMI",
    date: "2025",
    description: "Фотография для обложки Esmi, 2025.",
  },
  {
    id: "shootings-hypression",
    title: "HYPRESSION",
    date: "2023",
    description: "Фотографии, коллажи и микс-медиа для HYPRESSION, 2023.",
  },
  {
    id: "shootings-ofelia",
    title: "Ofelia",
    date: "2023",
    description: "Серия фотографий для спектакля Ofelia, 2023.",
  },
  {
    id: "shootings-berry-model-tests",
    title: "Berry Agency — модельные тесты",
    date: "2020",
    description: "",
  },
  {
    id: "shootings-berry-editorial",
    title: "Berry Agency — эдиториал с моделью агентства",
    date: "2020",
    description: "",
  },
  {
    id: "shootings-berry-lookbook",
    title: "Berry Agency — лукбук",
    date: "2020",
    description: "",
  },
  {
    id: "shootings-berry-product",
    title: "Berry Agency — предметная съёмка для бренда подарков",
    date: "2020",
    description: "",
  },
  {
    id: "shootings-behance-ecobasik",
    title: "Lookbook for Ecobasik",
    date: "",
    description: "",
  },
  {
    id: "shootings-behance-offmi",
    title: "Offmi",
    date: "",
    description: "",
  },
  {
    id: "shootings-behance-cinema-stills-2",
    title: "CINEMA STILLS 2",
    date: "",
    description: "",
  },
  {
    id: "shootings-behance-anka-model-tests",
    title: "Anka model tests",
    date: "",
    description: "",
  },
  {
    id: "shootings-behance-choose-your-character",
    title: "Choose your character",
    date: "",
    description: "",
  },
  {
    id: "shootings-behance-editorial-photography",
    title: "Editorial photography",
    date: "",
    description: "",
  },
];

const expectedIds = expectedRecords.map((record) => record.id);

const clone = (value) => structuredClone(value);

test("Shootings CMS storage has one overview and one file per stable shooting record", async () => {
  assert.equal(existsSync(overviewPath), true, `${overviewPath} must exist`);
  assert.equal(existsSync(recordsPath), true, `${recordsPath} must exist`);

  const overview = JSON.parse(await readFile(overviewPath, "utf8"));
  assert.deepEqual(overview, expectedOverview);

  const filenames = (await readdir(recordsPath)).filter((name) => name.endsWith(".json")).sort();
  assert.deepEqual(filenames, expectedIds.map((id) => `${id}.json`).sort());

  const records = await Promise.all(
    filenames.map(async (filename) => JSON.parse(await readFile(`${recordsPath}/${filename}`, "utf8"))),
  );
  assert.deepEqual(
    records.sort((left, right) => expectedIds.indexOf(left.id) - expectedIds.indexOf(right.id)),
    expectedRecords,
  );

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

  assert.deepEqual(SHOOTING_RECORD_IDS, expectedIds);
  assert.deepEqual(shootingsEditorialRecords, expectedRecords);
  assert.deepEqual(parseShootingsOverview(clone(expectedOverview)), expectedOverview);

  const malformed = clone(expectedRecords[0]);
  malformed.layout = "masonry";
  assert.throws(() => parseShootingEditorialRecord(malformed), /unexpected|field|key/i);

  const unknown = clone(expectedRecords[0]);
  unknown.id = "shootings-unregistered";
  assert.throws(() => parseShootingEditorialRecord(unknown), /unknown|id/i);

  const whitespace = clone(expectedRecords[0]);
  whitespace.title = "   ";
  assert.throws(() => parseShootingEditorialRecord(whitespace), /non-empty|string/i);

  const missingRenderedDescription = clone(expectedRecords[0]);
  missingRenderedDescription.description = "";
  assert.throws(() => parseShootingEditorialRecord(missingRenderedDescription), /description|non-empty/i);
});

test("Shootings CMS data preserves the current catalog and rendered copy", () => {
  assert.deepEqual(
    shootingsProjects.map(({ id, name, date }) => ({ id, title: name, date: date ?? "" })),
    expectedRecords.map(({ id, title, date }) => ({ id, title, date })),
  );

  const renderedOverview = renderProjectIntro(shootingsIntro);
  for (const text of Object.values(expectedOverview)) {
    assert.ok(renderedOverview.includes(text), `Rendered Shootings overview must preserve: ${text}`);
  }

  const renderedSections = [
    shootingsObladaetIntro,
    shootingsEvashaIntro,
    shootingsIgguanaIntro,
    shootingsEsmiIntro,
    shootingsHypressionIntro,
    shootingsOfeliaIntro,
  ].map((section) => renderSectionIntro(section));

  for (const [index, record] of expectedRecords.slice(0, 6).entries()) {
    assert.ok(renderedSections[index].includes(record.title));
    assert.ok(renderedSections[index].includes(record.description));
  }
});

test("Pages CMS exposes Shootings records without architecture or presentation controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("  - name: shootings\n");
  assert.notEqual(start, -1, "Shootings CMS group must exist");
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n  - name: ", 4);
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
