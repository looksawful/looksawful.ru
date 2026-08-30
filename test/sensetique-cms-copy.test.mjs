import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as sensetique from "../src/data/content/sensetique.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { renderSectionIntro } from "../src/templates/section-intro.ts";

const expected = {
  intro: {
    role: "Основатель",
    period: "2017–2018",
    lead: "Запустил и управлял московской фотостудией и продакшеном для моды, рекламы и визуального контента. Собирал команду, продюсировал съёмки и организовывал производство.",
  },
  sections: [
    {
      id: "studio",
      title: "Студия",
      paragraphs: [
        "В 2018 году закончили строительство студии с тремя съёмочными пространствами в здании завода на улице Дмитрия Ульянова, 42.",
      ],
    },
    {
      id: "production",
      title: "Продакшен",
      paragraphs: [
        "В 2017 году я запустил продакшен-агентство полного цикла Moch Fashn. Мы продюсировали и снимали фотосъёмки, занимались SMM и рекламой, разрабатывали и дорабатывали сайты, администрировали интернет-магазины. Снимали лукбуки и кампейны, стилизовали съёмки и делали редизайн сайтов для локальных брендов одежды. В 2018 году провели ребрендинг и масштабировали проект: начали строить коммерческую фотостудию и работать субподрядчиками крупных продакшен-агентств. Организовывали кастинги и логистику, предоставляли стилистов и ассистентов для рекламных проектов.",
      ],
    },
  ],
  credits: [
    { id: "buro247", lines: ["Фотограф Андрей Рапуто", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "olovo-booklet", title: "Дизайн буклета Olovo Moscow." },
    { id: "tatiana-nikishina", lines: ["Фотограф Татьяна Никишина", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "katya-knyazeva", lines: ["Фотограф Катя Князева", "Стилист Мария Жукова"] },
    { id: "yuri-ivanov", lines: ["Фотограф Юрий Иванов", "Стилист Мария Жукова", "Коллаж Иван Крушинский"] },
    { id: "harsh-light", title: "HARSH LIGHT, 2018.", lines: ["Фотограф Андрей Рапуто", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "raputo-editorial", lines: ["Фотограф Андрей Рапуто", "Стилист Мария Жукова"] },
    { id: "young-pioneer-sequence", title: "Young-pioneer", lines: ["Фотографы Дарья Сеничева и Никита Игнатов", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "krasota-dress", lines: ["Фотограф Дарья Сеничева", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "olovo-campaign", lines: ["Фотограф Никита Игнатов", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "olovo-lookbook-2016", lines: ["Фотограф Никита Игнатов", "Стилист Мария Жукова"] },
    { id: "olovo-lookbook-2018", lines: ["Фотограф Дарья Сеничева", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "inna-honour", lines: ["Фотограф Дарья Сеничева", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "olovo-architecture", title: "Архитектурные фотографии для брендбука Olovo Moscow.", lines: ["Фотограф Дарья Сеничева"] },
    { id: "chapurin", lines: ["Фотограф Андрей Рапуто", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "young-pioneer-strip", title: "Young-pioneer", lines: ["Фотографы Дарья Сеничева и Никита Игнатов", "Стилист Мария Жукова", "Продюсер Иван Крушинский", "Kaltblut Magazine"] },
    { id: "daniil-korotechenkov", lines: ["Фотограф Даниил Коротеченков", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "tatiana-nikishina-supplemental", lines: ["Фотограф Татьяна Никишина", "Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "wood-metal-panic", title: "Wood.Metal.PANIC!", lines: ["Фотограф Дарья Сахатская", "Стилист Мария Жукова", "Продюсер Иван Крушинский", "Художник по свету Валентин Панков"] },
    { id: "ivan-krushinsky", lines: ["Фотограф Иван Крушинский", "Стилист Мария Жукова"] },
    { id: "editorial-production", lines: ["Стилист Мария Жукова", "Продюсер Иван Крушинский"] },
    { id: "digital-fear", title: "Digital-fear-of-love — адверториал для ювелирного бренда MIMI MOSCOW", lines: ["Фотограф Елена Литвинюк", "Модель Данила Поляков"] },
  ],
  notes: [
    { id: "buro247", text: "Снимали для журналов спецпроекты и fashion stories, в том числе с селебрити. Для Bureau 24/7 сделали спецпроект с основателем «Силы ветра»." },
    { id: "olovo-lookbook-2016", text: "С брендами работали на постоянной основе и закрывали весь цикл контента: каталоги, кампейны, лукбуки, материалы для интернет-магазинов, графический дизайн и печатные материалы." },
  ],
};

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Sensetique editorial output baseline is explicit before CMS storage migration", () => {
  assert.deepEqual(
    { role: sensetique.sensetiqueIntro.role, period: sensetique.sensetiqueIntro.period, lead: sensetique.sensetiqueIntro.lead },
    expected.intro,
  );
  assert.deepEqual(sectionExports.map((section, index) => ({ id: expected.sections[index].id, ...section })), expected.sections);
  assert.deepEqual(
    creditExports.map((credits, index) => ({ id: expected.credits[index].id, ...credits })),
    expected.credits,
  );
  assert.deepEqual(
    [sensetique.sensetiqueBuro247Group.head?.note, sensetique.sensetiqueOlovoLookbook2016Reel.head?.note].map((note, index) => ({ id: expected.notes[index].id, text: note?.text })),
    expected.notes,
  );

  const rendered = [renderProjectIntro(sensetique.sensetiqueIntro), ...sectionExports.map((section) => renderSectionIntro(section))].join("\n");
  for (const text of [expected.intro.role, expected.intro.period, expected.intro.lead, ...expected.sections.flatMap((section) => [section.title, ...section.paragraphs])]) {
    assert.ok(rendered.includes(text), `Rendered Sensetique output must preserve: ${text}`);
  }
});

test("Sensetique CMS content file owns only editorial fields", async () => {
  const source = JSON.parse(await readFile(new URL("../src/content/cases/sensetique.json", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(source).sort(), ["credits", "intro", "notes", "sections"]);
  assert.deepEqual(source, expected);
});

test("Sensetique editorial parser rejects malformed structure and preserves code-owned ordering", async () => {
  const { parseSensetiqueEditorialContent, SENSETIQUE_CREDIT_IDS, SENSETIQUE_NOTE_IDS, SENSETIQUE_SECTION_IDS } = await import("../src/data/content/sensetique-editorial.ts");

  const parsed = parseSensetiqueEditorialContent(clone(expected));
  assert.deepEqual(parsed.sections.map((section) => section.id), SENSETIQUE_SECTION_IDS);
  assert.deepEqual(parsed.credits.map((credit) => credit.id), SENSETIQUE_CREDIT_IDS);
  assert.deepEqual(parsed.notes.map((note) => note.id), SENSETIQUE_NOTE_IDS);

  const reordered = clone(expected);
  reordered.sections.reverse();
  reordered.credits.reverse();
  reordered.notes.reverse();
  const normalized = parseSensetiqueEditorialContent(reordered);
  assert.deepEqual(normalized.sections.map((section) => section.id), SENSETIQUE_SECTION_IDS);
  assert.deepEqual(normalized.credits.map((credit) => credit.id), SENSETIQUE_CREDIT_IDS);
  assert.deepEqual(normalized.notes.map((note) => note.id), SENSETIQUE_NOTE_IDS);

  const duplicate = clone(expected);
  duplicate.credits[1].id = duplicate.credits[0].id;
  assert.throws(() => parseSensetiqueEditorialContent(duplicate), /duplicate|missing/i);

  const unknown = clone(expected);
  unknown.sections[0].id = "layout";
  assert.throws(() => parseSensetiqueEditorialContent(unknown), /unexpected|unknown/i);

  const whitespace = clone(expected);
  whitespace.credits[0].lines = ["   "];
  assert.throws(() => parseSensetiqueEditorialContent(whitespace), /non-empty|string/i);

  const presentationLeak = clone(expected);
  presentationLeak.credits[0].className = "project__section";
  assert.throws(() => parseSensetiqueEditorialContent(presentationLeak), /unexpected|field|key/i);
});

test("Pages CMS exposes Sensetique inside Cases without route or presentation controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  assert.match(cms, /- name: cases\s+label: Кейсы\s+type: group/s);
  assert.match(cms, /- name: sensetique-case[\s\S]*?path: src\/content\/cases\/sensetique\.json/);

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
