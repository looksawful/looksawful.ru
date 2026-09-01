import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as jestei from "../src/data/content/jestei-pool.ts";
import { getCase, getRole } from "../src/data/catalog/lookup.ts";
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

function readCanonicalIntro() {
  const caseData = getCase("jestei-pool");
  const role = caseData.primaryRoleLabel ?? (caseData.primaryRoleId ? getRole(caseData.primaryRoleId).name : "");
  return { caseData, role, period: caseData.date ?? "" };
}

test("Jestei CMS source owns editorial copy while Case owns intro identity", async () => {
  const source = await readSource();
  const { caseData } = readCanonicalIntro();

  assert.deepEqual(Object.keys(source).sort(), ["lead", "overlays", "sections"]);
  assert.equal(caseData.summary, undefined);
  assert.deepEqual(source.sections.map(({ id }) => id), sectionIds);
  assert.deepEqual(source.overlays.map(({ id }) => id), overlayIds);
});

test("Jestei live intro resolves role and period from canonical Case data and copy from CMS", async () => {
  const source = await readSource();
  const { role, period } = readCanonicalIntro();

  assert.equal(jestei.jesteiIntro.role, role);
  assert.equal(jestei.jesteiIntro.period, period);
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
  for (const value of [role, period, source.lead, ...source.sections.flatMap(({ title, paragraphs }) => [title, ...paragraphs])]) {
    assert.ok(rendered.includes(escapeHtml(value)), `Rendered Jestei output must consume canonical/CMS value: ${value}`);
  }
});

test("Jestei parser accepts legitimate copy edits but rejects Case-owned or structural leakage", async () => {
  const source = await readSource();
  const { parseJesteiEditorialContent, JESTEI_OVERLAY_IDS, JESTEI_SECTION_IDS } = await import("../src/data/content/jestei-editorial.ts");

  assert.deepEqual(parseJesteiEditorialContent(clone(source)), source);

  const edited = clone(source);
  edited.lead = "Обновлённый редакционный текст";
  edited.sections[0].title = "Новый заголовок";
  edited.overlays[0].text = "Новый текст карточки";
  const parsedEdited = parseJesteiEditorialContent(edited);
  assert.equal(parsedEdited.lead, edited.lead);
  assert.equal(parsedEdited.sections[0].title, edited.sections[0].title);
  assert.equal(parsedEdited.overlays[0].text, edited.overlays[0].text);

  const reordered = clone(source);
  reordered.sections.reverse();
  reordered.overlays.reverse();
  const normalized = parseJesteiEditorialContent(reordered);
  assert.deepEqual(normalized.sections.map(({ id }) => id), JESTEI_SECTION_IDS);
  assert.deepEqual(normalized.overlays.map(({ id }) => id), JESTEI_OVERLAY_IDS);

  const whitespaceLead = clone(source);
  whitespaceLead.lead = "   ";
  assert.equal(parseJesteiEditorialContent(whitespaceLead).lead, "");

  const missingCopy = clone(source);
  delete missingCopy.lead;
  delete missingCopy.sections[0].title;
  delete missingCopy.sections[0].paragraphs;
  delete missingCopy.overlays[0].text;
  const parsedMissingCopy = parseJesteiEditorialContent(missingCopy);
  assert.equal(parsedMissingCopy.lead, "");
  assert.equal(parsedMissingCopy.sections[0].title, "");
  assert.deepEqual(parsedMissingCopy.sections[0].paragraphs, []);
  assert.equal(parsedMissingCopy.overlays[0].text, "");

  const invalidCopy = clone(source);
  invalidCopy.lead = 42;
  assert.throws(() => parseJesteiEditorialContent(invalidCopy), /string/i);

  const duplicateSection = clone(source);
  duplicateSection.sections[6].id = "home";
  assert.throws(() => parseJesteiEditorialContent(duplicateSection), /duplicate|missing/i);

  for (const field of ["role", "period"]) {
    const ownershipLeak = clone(source);
    ownershipLeak[field] = field === "role" ? "Новая отображаемая роль" : "2024–2027";
    assert.throws(() => parseJesteiEditorialContent(ownershipLeak), /unexpected|field|key/i);
  }

  const presentationLeak = clone(source);
  presentationLeak.sections[0].className = "project__section";
  assert.throws(() => parseJesteiEditorialContent(presentationLeak), /unexpected|field|key/i);
});

test("Pages CMS exposes Jestei editorial copy without Case identity, route, media or runtime controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: jestei-case");
  assert.notEqual(start, -1);
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n      - name: ", 8);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  for (const field of ["lead", "sections", "id", "title", "paragraphs", "overlays", "text"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of ["role", "period", "entryId", "className", "layout", "route", "canonical", "href", "renderer", "filter", "before", "after", "captionView", "surfaceDeck"]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
