import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as jestei from "../src/data/content/jestei-pool.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { renderSectionIntro } from "../src/templates/section-intro.ts";
import { escapeHtml } from "../src/utils/html.ts";

const sectionIds = ["home", "brand", "interface", "editorial", "event", "landings", "promo"];
const overlayIds = ["logo-geometry", "product-color", "logo-variants", "design-system", "display-type", "audiences"];

const sectionExports = [
  jestei.jesteiHomeIntro,
  jestei.jesteiBrandIntro,
  jestei.jesteiInterfaceIntro,
  jestei.jesteiEditorialIntro,
  jestei.jesteiEventIntro,
  jestei.jesteiLandingsIntro,
  jestei.jesteiPromoIntro,
];

const clone = (value) => structuredClone(value);

async function readSource() {
  return JSON.parse(await readFile(new URL("../src/content/cases/jestei-pool.json", import.meta.url), "utf8"));
}

test("Jestei CMS source owns editable intro metadata and fixed editorial structures", async () => {
  const source = await readSource();

  assert.deepEqual(Object.keys(source).sort(), ["lead", "overlays", "period", "role", "sections"]);
  assert.equal(typeof source.role, "string");
  assert.ok(source.role.trim());
  assert.equal(typeof source.period, "string");
  assert.ok(source.period.trim());
  assert.deepEqual(source.sections.map(({ id }) => id), sectionIds);
  assert.deepEqual(source.overlays.map(({ id }) => id), overlayIds);
});

test("Jestei live intro, sections and overlays consume current CMS values", async () => {
  const source = await readSource();

  assert.equal(jestei.jesteiIntro.role, source.role);
  assert.equal(jestei.jesteiIntro.period, source.period);
  assert.equal(jestei.jesteiIntro.lead, source.lead);
  assert.deepEqual(
    sectionExports.map((section, index) => ({ id: sectionIds[index], title: section.title, paragraphs: section.paragraphs })),
    source.sections,
  );
  assert.deepEqual(
    jestei.jesteiBrandSystemGroup.items.map((item, index) => ({ id: overlayIds[index], text: item.surfaceOverlay?.text })),
    source.overlays,
  );

  const rendered = [renderProjectIntro(jestei.jesteiIntro), ...sectionExports.map(renderSectionIntro)].join("\n");
  for (const value of [source.role, source.period, source.lead, ...source.sections.flatMap(({ title, paragraphs }) => [title, ...paragraphs])]) {
    assert.ok(rendered.includes(escapeHtml(value)), `Rendered Jestei output must consume current CMS value: ${value}`);
  }
});

test("Jestei parser accepts legitimate copy edits but rejects structural leakage", async () => {
  const source = await readSource();
  const { parseJesteiEditorialContent, JESTEI_OVERLAY_IDS, JESTEI_SECTION_IDS } = await import("../src/data/content/jestei-editorial.ts");

  assert.deepEqual(parseJesteiEditorialContent(clone(source)), source);

  const edited = clone(source);
  edited.role = "Новая отображаемая роль";
  edited.period = "2024–2027";
  edited.lead = "Обновлённый редакционный текст";
  edited.sections[0].title = "Новый заголовок";
  edited.overlays[0].text = "Новый текст карточки";
  const parsedEdited = parseJesteiEditorialContent(edited);
  assert.equal(parsedEdited.role, edited.role);
  assert.equal(parsedEdited.period, edited.period);
  assert.equal(parsedEdited.lead, edited.lead);
  assert.equal(parsedEdited.sections[0].title, edited.sections[0].title);
  assert.equal(parsedEdited.overlays[0].text, edited.overlays[0].text);

  const reordered = clone(source);
  reordered.sections.reverse();
  reordered.overlays.reverse();
  const normalized = parseJesteiEditorialContent(reordered);
  assert.deepEqual(normalized.sections.map(({ id }) => id), JESTEI_SECTION_IDS);
  assert.deepEqual(normalized.overlays.map(({ id }) => id), JESTEI_OVERLAY_IDS);

  const whitespaceRole = clone(source);
  whitespaceRole.role = "   ";
  assert.throws(() => parseJesteiEditorialContent(whitespaceRole), /non-empty|string/i);

  const duplicateSection = clone(source);
  duplicateSection.sections[6].id = "home";
  assert.throws(() => parseJesteiEditorialContent(duplicateSection), /duplicate|missing/i);

  const presentationLeak = clone(source);
  presentationLeak.sections[0].className = "project__section";
  assert.throws(() => parseJesteiEditorialContent(presentationLeak), /unexpected|field|key/i);
});

test("Pages CMS exposes Jestei editorial metadata without route, media or runtime controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: jestei-case");
  assert.notEqual(start, -1);
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n      - name: ", 8);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  for (const field of ["role", "period", "lead", "sections", "id", "title", "paragraphs", "overlays", "text"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of ["entryId", "className", "layout", "route", "canonical", "href", "renderer", "filter", "before", "after", "captionView", "surfaceDeck"]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
