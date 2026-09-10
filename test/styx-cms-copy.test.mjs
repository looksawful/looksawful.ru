import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as styx from "../src/data/content/styx.ts";
import { getCase, getRole } from "../src/data/catalog/lookup.ts";
import { styxMediaEntries } from "../src/data/media/entries/styx.ts";
import { shootingCardGroups } from "../src/data/subproject-cards.ts";
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

function readCanonicalIntro() {
  const caseData = getCase("styx");
  const role = caseData.primaryRoleLabel ?? (caseData.primaryRoleId ? getRole(caseData.primaryRoleId).name : "");
  return { caseData, role, period: caseData.date ?? "" };
}

function assertCanonicalBrandName(value, label) {
  if (!value) {
    return;
  }

  assert.doesNotMatch(value, /\bStyx Jewels\b/, `${label} must not use the old plural brand name`);
  assert.doesNotMatch(value, /\bStyx\b(?!\s+Jewel)/, `${label} must use the full Styx Jewel display name`);
}

test("Styx CMS source owns editorial copy while Case owns intro identity", async () => {
  const source = await readSource();
  const { caseData } = readCanonicalIntro();

  assert.deepEqual(Object.keys(source).sort(), ["credits", "lead", "sections"]);
  assert.equal(caseData.summary, undefined);
  assert.deepEqual(source.sections.map(({ id }) => id), sectionIds);
  assert.deepEqual(source.credits.map(({ id }) => id), creditIds);
});

test("Styx live intro resolves role and period from canonical Case data and copy from CMS", async () => {
  const source = await readSource();
  const { role, period } = readCanonicalIntro();

  assert.equal(styx.styxIntro.role, role);
  assert.equal(styx.styxIntro.period, period);
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
  for (const value of [role, period, source.lead, ...source.sections.flatMap(({ title, paragraphs }) => [title, ...paragraphs])]) {
    assert.ok(rendered.includes(escapeHtml(value)), `Rendered Styx output must consume canonical/CMS value: ${value}`);
  }
});

test("Styx parser accepts legitimate copy edits but rejects Case-owned or structural leakage", async () => {
  const source = await readSource();
  const { parseStyxEditorialContent, STYX_CREDIT_IDS, STYX_SECTION_IDS } = await import("../src/data/content/styx-editorial.ts");

  assert.deepEqual(parseStyxEditorialContent(clone(source)), source);

  const edited = clone(source);
  edited.lead = "Обновлённый редакционный текст";
  edited.sections[0].title = "Новый заголовок";
  edited.credits[0].title = "Новая подпись";
  const parsedEdited = parseStyxEditorialContent(edited);
  assert.equal(parsedEdited.lead, edited.lead);
  assert.equal(parsedEdited.sections[0].title, edited.sections[0].title);
  assert.equal(parsedEdited.credits[0].title, edited.credits[0].title);

  const reordered = clone(source);
  reordered.sections.reverse();
  reordered.credits.reverse();
  const normalized = parseStyxEditorialContent(reordered);
  assert.deepEqual(normalized.sections.map(({ id }) => id), STYX_SECTION_IDS);
  assert.deepEqual(normalized.credits.map(({ id }) => id), STYX_CREDIT_IDS);

  const whitespaceLead = clone(source);
  whitespaceLead.lead = "   ";
  assert.equal(parseStyxEditorialContent(whitespaceLead).lead, "");

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
  invalidCopy.lead = 42;
  assert.throws(() => parseStyxEditorialContent(invalidCopy), /string/i);

  const duplicateSection = clone(source);
  duplicateSection.sections[4].id = "brand";
  assert.throws(() => parseStyxEditorialContent(duplicateSection), /duplicate|missing/i);

  for (const field of ["role", "period"]) {
    const ownershipLeak = clone(source);
    ownershipLeak[field] = field === "role" ? "Новая отображаемая роль" : "2021–2026";
    assert.throws(() => parseStyxEditorialContent(ownershipLeak), /unexpected|field|key/i);
  }

  const presentationLeak = clone(source);
  presentationLeak.sections[0].className = "project__section";
  assert.throws(() => parseStyxEditorialContent(presentationLeak), /unexpected|field|key/i);
});

test("Pages CMS exposes Styx editorial copy without Case identity, route, media or presentation controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: styx-case");
  assert.notEqual(start, -1);
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n      - name: ", 8);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  for (const field of ["lead", "sections", "id", "title", "paragraphs", "credits"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of ["role", "period", "entryId", "className", "layout", "route", "canonical", "href", "renderer"]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});

test("Styx user-facing sources keep the canonical Styx Jewel display name", async () => {
  const source = await readSource();
  const values = [
    source.lead,
    ...source.sections.flatMap(({ title, paragraphs }) => [title, ...paragraphs]),
    ...source.credits.map(({ title }) => title),
  ];
  for (const value of values) {
    assertCanonicalBrandName(value, "live CMS copy");
  }

  for (const entry of styxMediaEntries) {
    const values = [entry.title, entry.alt, entry.caption?.title, entry.caption?.text, ...(entry.caption?.meta ?? [])];
    for (const value of values) {
      assertCanonicalBrandName(value, `media entry ${entry.id}`);
    }
  }

  for (const group of shootingCardGroups) {
    for (const card of group.cards) {
      if (card.id.startsWith("styx-")) {
        assertCanonicalBrandName(card.title, `subproject card ${card.id}`);
      }
    }
  }

  const legacyIndex = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(legacyIndex, /\bStyx Jewels\b/, "legacy index must not use the old plural brand name");
  assert.equal(getCase("styx").name, "Styx Jewel");
});
