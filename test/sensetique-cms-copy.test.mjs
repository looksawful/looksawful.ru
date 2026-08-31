import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as sensetique from "../src/data/content/sensetique.ts";
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

test("Sensetique CMS source keeps fixed editorial identities while copy remains editable", async () => {
  const source = await readSource();
  assert.deepEqual(Object.keys(source).sort(), ["credits", "intro", "notes", "sections"]);
  assert.deepEqual(Object.keys(source.intro).sort(), ["lead", "period", "role"]);
  assert.deepEqual(source.sections.map(({ id }) => id), sectionIds);
  assert.deepEqual(source.credits.map(({ id }) => id), creditIds);
  assert.deepEqual(source.notes.map(({ id }) => id), noteIds);
});

test("Sensetique live intro, sections, credits and notes consume current CMS values", async () => {
  const source = await readSource();

  assert.deepEqual(
    { role: sensetique.sensetiqueIntro.role, period: sensetique.sensetiqueIntro.period, lead: sensetique.sensetiqueIntro.lead },
    source.intro,
  );
  assert.deepEqual(sectionExports.map((section, index) => ({ id: sectionIds[index], ...section })), source.sections);
  assert.deepEqual(creditExports.map((credits, index) => ({ id: creditIds[index], ...credits })), source.credits);
  assert.deepEqual(
    [sensetique.sensetiqueBuro247Group.head?.note, sensetique.sensetiqueOlovoLookbook2016Reel.head?.note].map((note, index) => ({ id: noteIds[index], text: note?.text })),
    source.notes,
  );

  const rendered = [renderProjectIntro(sensetique.sensetiqueIntro), ...sectionExports.map(renderSectionIntro)].join("\n");
  for (const value of [source.intro.role, source.intro.period, source.intro.lead, ...source.sections.flatMap(({ title, paragraphs }) => [title, ...paragraphs])]) {
    assert.ok(rendered.includes(escapeHtml(value)), `Rendered Sensetique output must consume current CMS value: ${value}`);
  }
});

test("Sensetique parser accepts legitimate copy edits but rejects structural leakage", async () => {
  const source = await readSource();
  const { parseSensetiqueEditorialContent, SENSETIQUE_CREDIT_IDS, SENSETIQUE_NOTE_IDS, SENSETIQUE_SECTION_IDS } = await import("../src/data/content/sensetique-editorial.ts");

  assert.deepEqual(parseSensetiqueEditorialContent(clone(source)), source);

  const edited = clone(source);
  edited.intro.role = "Новая отображаемая роль";
  edited.intro.period = "2017–2019";
  edited.intro.lead = "Обновлённый вводный текст";
  edited.sections[0].title = "Новый заголовок";
  edited.credits[0].lines = ["Новая строка кредита"];
  edited.notes[0].text = "Новое примечание";
  const parsedEdited = parseSensetiqueEditorialContent(edited);
  assert.equal(parsedEdited.intro.role, edited.intro.role);
  assert.equal(parsedEdited.intro.period, edited.intro.period);
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
  assert.throws(() => parseSensetiqueEditorialContent(whitespace), /non-empty|string/i);

  const presentationLeak = clone(source);
  presentationLeak.credits[0].className = "project__section";
  assert.throws(() => parseSensetiqueEditorialContent(presentationLeak), /unexpected|field|key/i);
});

test("Pages CMS exposes Sensetique copy without route or presentation controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: sensetique-case");
  assert.notEqual(start, -1);
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n      - name: ", 8);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  for (const field of ["intro", "role", "period", "lead", "sections", "credits", "notes", "id", "title", "lines", "text"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }
  for (const forbidden of ["entryId", "className", "layout", "route", "canonical", "href", "renderer", "captionView", "columns"]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
