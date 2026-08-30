import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as styx from "../src/data/content/styx.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { renderSectionIntro } from "../src/templates/section-intro.ts";

const expected = {
  lead: "Возглавил работу над визуальной системой московского бренда украшений, аксессуаров и одежды, вдохновлённого готической романтикой и лавкрафтовским ужасом.",
  sections: [
    {
      id: "brand",
      title: "Айдентика",
      paragraphs: [
        "С нуля собрал визуальную систему Styx: разработал логотип, фирменный стиль, упаковку, печатные материалы, оформление соцсетей, рекламные публикации и баннеры.",
      ],
    },
    {
      id: "production",
      title: "Продакшен",
      paragraphs: [
        "Продюсировал и снимал кампейны, лукбуки и каталоги Styx. Готовил материал для рекламы, каталогов и соцсетей, делал техническую, художественную и экспериментальную обработку фотографий и создавал сканографические анимации и арты.",
      ],
    },
    {
      id: "scanography",
      title: "Сканографии",
      paragraphs: [
        "Для Styx придумал собственную технику сканографии. Сканировал один объект разными сканерами и вручную монтировал кадры, поэтому искажения и артефакты возникали при сканировании, а не имитировались цифровой обработкой.",
      ],
    },
    {
      id: "shootings",
      title: "Съёмки",
      paragraphs: [
        "Продюсировал и снимал для Styx лукбуки, кампейны и коллаборации. Из отснятого материала собирал каталожные, рекламные и экспериментальные визуалы бренда.",
      ],
    },
    {
      id: "lookbook",
      title: "Лукбук",
      paragraphs: ["Снял лукбук Styx Jewel 2025 года."],
    },
  ],
  credits: [
    { id: "brand-lookbook-2023", title: "Лукбук Styx Jewels, 2023." },
    { id: "scanography-2021", title: "Сканография, 2021." },
    { id: "lookbook-2025", title: "Лукбук Styx Jewels, 2025." },
  ],
};

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Styx editorial output baseline is explicit before CMS storage migration", () => {
  assert.equal(styx.styxIntro.lead, expected.lead);
  assert.deepEqual(
    sectionExports.map((section, index) => ({ id: expected.sections[index].id, ...section })),
    expected.sections,
  );
  assert.deepEqual(
    creditExports.map((credits, index) => ({ id: expected.credits[index].id, title: credits?.title })),
    expected.credits,
  );

  const rendered = [
    renderProjectIntro(styx.styxIntro),
    ...sectionExports.map((section) => renderSectionIntro(section)),
  ].join("\n");

  for (const text of [expected.lead, ...expected.sections.flatMap((section) => [section.title, ...section.paragraphs])]) {
    assert.ok(rendered.includes(text), `Rendered Styx output must preserve: ${text}`);
  }
});

test("Styx CMS content file owns only fixed editorial copy fields", async () => {
  const source = JSON.parse(
    await readFile(new URL("../src/content/cases/styx.json", import.meta.url), "utf8"),
  );

  assert.deepEqual(Object.keys(source).sort(), ["credits", "lead", "sections"]);
  assert.equal(source.lead, expected.lead);
  assert.deepEqual(source.sections, expected.sections);
  assert.deepEqual(source.credits, expected.credits);
});

test("Styx editorial parser rejects malformed structure and preserves code-owned ordering", async () => {
  const {
    parseStyxEditorialContent,
    STYX_CREDIT_IDS,
    STYX_SECTION_IDS,
  } = await import("../src/data/content/styx-editorial.ts");

  const parsed = parseStyxEditorialContent(clone(expected));
  assert.deepEqual(parsed.sections.map((section) => section.id), STYX_SECTION_IDS);
  assert.deepEqual(parsed.credits.map((credit) => credit.id), STYX_CREDIT_IDS);

  const reordered = clone(expected);
  reordered.sections.reverse();
  reordered.credits.reverse();
  const normalized = parseStyxEditorialContent(reordered);
  assert.deepEqual(normalized.sections.map((section) => section.id), STYX_SECTION_IDS);
  assert.deepEqual(normalized.credits.map((credit) => credit.id), STYX_CREDIT_IDS);

  const duplicateSection = clone(expected);
  duplicateSection.sections[4].id = "brand";
  assert.throws(() => parseStyxEditorialContent(duplicateSection), /duplicate|missing/i);

  const unknownSection = clone(expected);
  unknownSection.sections[0].id = "layout";
  assert.throws(() => parseStyxEditorialContent(unknownSection), /unexpected|unknown/i);

  const whitespace = clone(expected);
  whitespace.sections[0].paragraphs = ["   "];
  assert.throws(() => parseStyxEditorialContent(whitespace), /non-empty|string/i);

  const presentationLeak = clone(expected);
  presentationLeak.sections[0].className = "project__section";
  assert.throws(() => parseStyxEditorialContent(presentationLeak), /unexpected|field|key/i);
});

test("Pages CMS exposes Styx inside a Cases group without route or presentation controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");

  assert.match(cms, /- name: cases\s+label: Кейсы\s+type: group/s);
  assert.match(cms, /- name: styx-case[\s\S]*?path: src\/content\/cases\/styx\.json/);

  const start = cms.indexOf("      - name: styx-case");
  assert.notEqual(start, -1);
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n      - name: ", 8);
  const styxConfig = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  for (const field of ["lead", "sections", "id", "title", "paragraphs", "credits"]) {
    assert.match(styxConfig, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of ["entryId", "className", "layout", "route", "canonical", "href", "renderer"] ) {
    assert.doesNotMatch(styxConfig, new RegExp(`name: ${forbidden}\\b`));
  }
});
