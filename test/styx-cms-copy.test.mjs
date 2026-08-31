import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as styx from "../src/data/content/styx.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { renderSectionIntro } from "../src/templates/section-intro.ts";
import { escapeHtml } from "../src/utils/html.ts";

const sectionIds = ["brand", "production", "scanography", "shootings", "lookbook"];
const creditIds = ["brand-lookbook-2023", "scanography-2021", "lookbook-2025"];

const sectionExports = [
  styx.styxBrandIntro,
  styx.styxProductionIntro,
  styx.styxScanographyIntro,
  styx.styxShootingsIntro,
  styx.styxLookbookIntro,
];

const creditExports = [
  styx.styxBrandLookbookReel.head?.credits,
  styx.styxScanographyStrip.head?.credits,
  styx.styxLookbook2025Reel.head?.credits,
];

const clone = (value) => structuredClone(value);

async function readSource() {
  return JSON.parse(await readFile(new URL("../src/content/cases/styx.json", import.meta.url), "utf8"));
}

test("Styx CMS source owns editable intro metadata and fixed editorial structures", async () => {
  const source = await readSource();

  assert.deepEqual(Object.keys(source).sort(), ["credits", "lead", "period", "role", "sections"]);
  assert.equal(typeof source.role, "string");
  assert.ok(source.role.trim());
  assert.equal(typeof source.period, "string");
  assert.ok(source.period.trim());
  assert.deepEqual(source.sections.map(({ id }) => id), sectionIds);
  assert.deepEqual(source.credits.map(({ id }) => id), creditIds);
});

test("Styx live intro, sections and credits consume current CMS values", async () => {
  const source = await readSource();

  assert.equal(styx.styxIntro.role, source.role);
  assert.equal(styx.styxIntro.period, source.period);
  assert.equal(styx.styxIntro.lead, source.lead);
  assert.deepEqual(
    sectionExports.map((section, index) => ({ id: sectionIds[index], title: section.title, paragraphs: section.paragraphs })),
    source.sections,
  );
  assert.deepEqual(
    creditExports.map((credits, index) => ({ id: creditIds[index], title: credits?.title })),
    source.credits,
  );

  const rendered = [renderProjectIntro(styx.styxIntro), ...sectionExports.map(renderSectionIntro)].join("\n");
  for (const value of [source.role, source.period, source.lead, ...source.sections.flatMap(({ title, paragraphs }) => [title, ...paragraphs])]) {
    assert.ok(rendered.includes(escapeHtml(value)), `Rendered Styx output must consume current CMS value: ${value}`);
  }
});

test("Styx parser accepts legitimate copy edits but rejects structural leakage", async () => {
  const source = await readSource();
  const { parseStyxEditorialContent, STYX_CREDIT_IDS, STYX_SECTION_IDS } = await import("../src/data/content/styx-editorial.ts");

  assert.deepEqual(parseStyxEditorialContent(clone(source)), source);

  const edited = clone(source);
  edited.role = "Новая отображаемая роль";
  edited.period = "2021–2026";
  edited.lead = "Обновлённый редакционный текст";
  edited.sections[0].title = "Новый заголовок";
  edited.credits[0].title = "Новая подпись";
  const parsedEdited = parseStyxEditorialContent(edited);
  assert.equal(parsedEdited.role, edited.role);
  assert.equal(parsedEdited.period, edited.period);
  assert.equal(parsedEdited.lead, edited.lead);
  assert.equal(parsedEdited.sections[0].title, edited.sections[0].title);
  assert.equal(parsedEdited.credits[0].title, edited.credits[0].title);

  const reordered = clone(source);
  reordered.sections.reverse();
  reordered.credits.reverse();
  const normalized = parseStyxEditorialContent(reordered);
  assert.deepEqual(normalized.sections.map(({ id }) => id), STYX_SECTION_IDS);
  assert.deepEqual(normalized.credits.map(({ id }) => id), STYX_CREDIT_IDS);

  const whitespaceRole = clone(source);
  whitespaceRole.role = "   ";
  assert.equal(parseStyxEditorialContent(whitespaceRole).role, "");

  const missingCopy = clone(source);
  delete missingCopy.lead;
  delete missingCopy.sections[0].title;
  delete missingCopy.sections[0].paragraphs;
  delete missingCopy.credits[0].title;
  const parsedMissingCopy = parseStyxEditorialContent(missingCopy);
  assert.equal(parsedMissingCopy.lead, "");
  assert.equal(parsedMissingCopy.sections[0].title, "");
  assert.deepEqual(parsedMissingCopy.sections[0].paragraphs, []);
  assert.equal(parsedMissingCopy.credits[0].title, "");

  const invalidCopy = clone(source);
  invalidCopy.role = 42;
  assert.throws(() => parseStyxEditorialContent(invalidCopy), /string/i);

  const duplicateSection = clone(source);
  duplicateSection.sections[4].id = "brand";
  assert.throws(() => parseStyxEditorialContent(duplicateSection), /duplicate|missing/i);

  const presentationLeak = clone(source);
  presentationLeak.sections[0].className = "project__section";
  assert.throws(() => parseStyxEditorialContent(presentationLeak), /unexpected|field|key/i);
});

test("Pages CMS exposes Styx editorial metadata without route, media or presentation controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: styx-case");
  assert.notEqual(start, -1);
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n      - name: ", 8);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  for (const field of ["role", "period", "lead", "sections", "id", "title", "paragraphs", "credits"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of ["entryId", "className", "layout", "route", "canonical", "href", "renderer"]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
