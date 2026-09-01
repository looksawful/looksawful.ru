import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as sensetique from "../src/data/content/sensetique.ts";
import { getCase, getRole } from "../src/data/catalog/lookup.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { renderSectionIntro } from "../src/templates/section-intro.ts";
import { escapeHtml } from "../src/utils/html.ts";

const sectionIds = ["studio", "production"];
const noteIds = ["buro247", "olovo-lookbook-2016"];
const creditIds = [
  "buro247",
  "olovo-booklet",
  "tatiana-nikishina",
  "katya-knyazeva",
  "yuri-ivanov",
  "harsh-light",
  "raputo-editorial",
  "young-pioneer-sequence",
  "krasota-dress",
  "olovo-campaign",
  "olovo-lookbook-2016",
  "olovo-lookbook-2018",
  "inna-honour",
  "olovo-architecture",
  "chapurin",
  "young-pioneer-strip",
  "daniil-korotechenkov",
  "tatiana-nikishina-supplemental",
  "wood-metal-panic",
  "ivan-krushinsky",
  "editorial-production",
  "digital-fear",
];

const sectionExports = [sensetique.sensetiqueStudioIntro, sensetique.sensetiqueProductionIntro];
const creditExports = [
  sensetique.sensetiqueBuro247Group.head?.credits,
  sensetique.sensetiqueOlovoBookletGroup.head?.credits,
  sensetique.sensetiqueTatianaNikishinaEditorialGroup.head?.credits,
  sensetique.sensetiqueKatyaKnyazevaEditorialGroup.head?.credits,
  sensetique.sensetiqueYuriIvanovEditorialGroup.head?.credits,
  sensetique.sensetiqueHarshLightStrip.head?.credits,
  sensetique.sensetiqueRaputoEditorialStrip.head?.credits,
  sensetique.sensetiqueYoungPioneerSequence.head?.credits,
  sensetique.sensetiqueKrasotaDressStrip.head?.credits,
  sensetique.sensetiqueOlovoCampaignStrip.head?.credits,
  sensetique.sensetiqueOlovoLookbook2016Reel.head?.credits,
  sensetique.sensetiqueOlovoLookbook2018Reel.head?.credits,
  sensetique.sensetiqueInnaHonourReel.head?.credits,
  sensetique.sensetiqueOlovoArchitectureStrip.head?.credits,
  sensetique.sensetiqueChapurinBentoGroup.head?.credits,
  sensetique.sensetiqueYoungPioneerStrip.head?.credits,
  sensetique.sensetiqueDaniilKorotechenkovSequence.head?.credits,
  sensetique.sensetiqueTatianaNikishinaSupplementalReel.head?.credits,
  sensetique.sensetiqueWoodMetalPanicStrip.head?.credits,
  sensetique.sensetiqueIvanKrushinskyEditorialStrip.head?.credits,
  sensetique.sensetiqueEditorialProductionReel.head?.credits,
  sensetique.sensetiqueDigitalFearPageFlip.credits,
];

const clone = (value) => structuredClone(value);

async function readSource() {
  return JSON.parse(await readFile(new URL("../src/content/cases/sensetique.json", import.meta.url), "utf8"));
}

function readCanonicalIntro() {
  const caseData = getCase("sensetique");
  const role = caseData.primaryRoleLabel ?? (caseData.primaryRoleId ? getRole(caseData.primaryRoleId).name : "");
  return { caseData, role, period: caseData.periodLabel ?? caseData.date ?? "" };
}

test("Sensetique CMS source keeps fixed editorial identities while Case owns intro identity", async () => {
  const source = await readSource();
  const { caseData } = readCanonicalIntro();

  assert.deepEqual(Object.keys(source).sort(), ["credits", "intro", "notes", "sections"]);
  assert.deepEqual(Object.keys(source.intro).sort(), ["lead"]);
  assert.equal(caseData.summary, undefined);
  assert.equal(caseData.date, "2016–2018");
  assert.equal(caseData.periodLabel, "2017–2018");
  assert.deepEqual(source.sections.map(({ id }) => id), sectionIds);
  assert.deepEqual(source.credits.map(({ id }) => id), creditIds);
  assert.deepEqual(source.notes.map(({ id }) => id), noteIds);
});

test("Sensetique live intro resolves role and period from canonical Case data and copy from CMS", async () => {
  const source = await readSource();
  const { role, period } = readCanonicalIntro();

  assert.equal(period, "2017–2018");
  assert.deepEqual(
    { role: sensetique.sensetiqueIntro.role, period: sensetique.sensetiqueIntro.period, lead: sensetique.sensetiqueIntro.lead },
    { role, period, lead: source.intro.lead },
  );
  assert.deepEqual(sectionExports.map((section, index) => ({ id: sectionIds[index], ...section })), source.sections);
  assert.deepEqual(creditExports.map((credits, index) => ({ id: creditIds[index], ...credits })), source.credits);
  assert.deepEqual(
    [sensetique.sensetiqueBuro247Group.head?.note, sensetique.sensetiqueOlovoLookbook2016Reel.head?.note].map((note, index) => ({ id: noteIds[index], text: note?.text })),
    source.notes,
  );

  const rendered = [renderProjectIntro(sensetique.sensetiqueIntro), ...sectionExports.map(renderSectionIntro)].join("\n");
  for (const value of [role, period, source.intro.lead, ...source.sections.flatMap(({ title, paragraphs }) => [title, ...paragraphs])]) {
    assert.ok(rendered.includes(escapeHtml(value)), `Rendered Sensetique output must consume canonical/CMS value: ${value}`);
  }
});

test("Sensetique parser accepts legitimate copy edits but rejects Case-owned or structural leakage", async () => {
  const source = await readSource();
  const { parseSensetiqueEditorialContent, SENSETIQUE_CREDIT_IDS, SENSETIQUE_NOTE_IDS, SENSETIQUE_SECTION_IDS } = await import("../src/data/content/sensetique-editorial.ts");

  assert.deepEqual(parseSensetiqueEditorialContent(clone(source)), {
    ...source,
    credits: source.credits.map((credit) => ({
      ...credit,
      title: credit.title ?? "",
      lines: credit.lines ?? [],
    })),
  });

  const edited = clone(source);
  edited.intro.lead = "Обновлённый вводный текст";
  edited.sections[0].title = "Новый заголовок";
  edited.credits[0].lines = ["Новая строка кредита"];
  edited.notes[0].text = "Новое примечание";
  const parsedEdited = parseSensetiqueEditorialContent(edited);
  assert.equal(parsedEdited.intro.lead, edited.intro.lead);
  assert.equal(parsedEdited.sections[0].title, edited.sections[0].title);
  assert.deepEqual(parsedEdited.credits[0].lines, edited.credits[0].lines);
  assert.equal(parsedEdited.notes[0].text, edited.notes[0].text);

  const reordered = clone(source);
  reordered.sections.reverse();
  reordered.credits.reverse();
  reordered.notes.reverse();
  const normalized = parseSensetiqueEditorialContent(reordered);
  assert.deepEqual(normalized.sections.map(({ id }) => id), SENSETIQUE_SECTION_IDS);
  assert.deepEqual(normalized.credits.map(({ id }) => id), SENSETIQUE_CREDIT_IDS);
  assert.deepEqual(normalized.notes.map(({ id }) => id), SENSETIQUE_NOTE_IDS);

  const duplicate = clone(source);
  duplicate.credits[1].id = duplicate.credits[0].id;
  assert.throws(() => parseSensetiqueEditorialContent(duplicate), /duplicate|missing/i);

  const whitespace = clone(source);
  whitespace.credits[0].lines = ["   "];
  assert.deepEqual(parseSensetiqueEditorialContent(whitespace).credits[0].lines, []);

  const missingCopy = clone(source);
  delete missingCopy.intro.lead;
  delete missingCopy.sections[0].title;
  delete missingCopy.sections[0].paragraphs;
  delete missingCopy.credits[0].title;
  delete missingCopy.credits[0].lines;
  delete missingCopy.notes[0].text;
  const parsedMissingCopy = parseSensetiqueEditorialContent(missingCopy);
  assert.equal(parsedMissingCopy.intro.lead, "");
  assert.equal(parsedMissingCopy.sections[0].title, "");
  assert.deepEqual(parsedMissingCopy.sections[0].paragraphs, []);
  assert.deepEqual(parsedMissingCopy.credits[0], { id: "buro247", title: "", lines: [] });
  assert.equal(parsedMissingCopy.notes[0].text, "");

  const invalidCopy = clone(source);
  invalidCopy.notes[0].text = 42;
  assert.throws(() => parseSensetiqueEditorialContent(invalidCopy), /string/i);

  for (const field of ["role", "period"]) {
    const ownershipLeak = clone(source);
    ownershipLeak.intro[field] = field === "role" ? "Новая отображаемая роль" : "2017–2019";
    assert.throws(() => parseSensetiqueEditorialContent(ownershipLeak), /unexpected|field|key/i);
  }

  const presentationLeak = clone(source);
  presentationLeak.credits[0].className = "project__section";
  assert.throws(() => parseSensetiqueEditorialContent(presentationLeak), /unexpected|field|key/i);
});

test("Pages CMS exposes Sensetique copy without Case identity, route or presentation controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: sensetique-case");
  assert.notEqual(start, -1);
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n      - name: ", 8);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  for (const field of ["intro", "lead", "sections", "credits", "notes", "id", "title", "lines", "text"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }
  for (const forbidden of ["role", "period", "entryId", "className", "layout", "route", "canonical", "href", "renderer", "captionView", "columns"]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
