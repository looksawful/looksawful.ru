import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as jestei from "../src/data/content/jestei-pool.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { renderSectionIntro } from "../src/templates/section-intro.ts";

const expected = {
  lead: "Сформировал новый визуальный язык главного российского диджейского пула, разработал UX/UI-стратегию core-продуктов и два с половиной года руководил командой дизайнеров.",
  sections: [
    {
      id: "home",
      title: "Персонализация",
      paragraphs: [
        "На главной Jestei Pool пользователи видят баннеры о новых релизах и обновлениях контента. Мы заменили стоковые фотографии генеративными изображениями и переработали адаптивность компонента. В результате сократили расходы на производство баннеров в 2,5 раза. Ввели показ по интересам пользователя. Например, клубные диджеи, которые не заходят в Event, больше не видят его обновления. Для регулярных рубрик разработали свои визуальные концепции, поэтому креативы стали последовательными и узнаваемыми.",
      ],
    },
    {
      id: "brand",
      title: "Ребрендинг",
      paragraphs: [
        "Провели ребрендинг Jestei Pool: серьёзно переработали логотип, обновили типографику и сделали цвет частью продуктовой навигации. Новую айдентику встроили в интерфейс и дизайн-систему.",
      ],
    },
    {
      id: "interface",
      title: "Продукт",
      paragraphs: [
        "Сгруппировали плейлисты и добавили заголовки и описания. Наняли редактора и вместе с диджеями описали больше 200 плейлистов и все жанры. Для каждой группы разработали свой стиль обложек вместо однообразных стоковых картинок.",
        "Разработали алгоритмические плейлисты. Они собирают популярные треки по жанру или части мероприятия и исключают музыку, которую пользователь уже слышал. Например, плейлист может предложить десять популярных треков для праймтайма или афтерпати, которые пользователь ещё не знает.",
        "Полностью переделали сценарий покупки подписки. Объяснили разницу между тарифами и обозначили предложения для разных сегментов своими цветами.",
      ],
    },
    {
      id: "editorial",
      title: "Коммуникации",
      paragraphs: [
        "Собрали единые правила для tone of voice, терминологии, UX-текстов, интерфейсных текстов и редакционной работы Jestei Pool.",
      ],
    },
    {
      id: "event",
      title: "Масштабы",
      paragraphs: [
        "Добавили на лендинг Canvas-анимации и интерактивные виджеты. Лента с треками знакомит пользователя с интерфейсом и инструментами сервиса прямо на странице. Там же показали плейлисты и музыкальные жанры. Анимации для клубных диджеев сделали на моей библиотеке Moves Awful.",
        "Спрос в ивент-диджеинге зависит от сезона, поэтому его можно прогнозировать. Мы исследовали, какие плейлисты чаще всего нужны ивент-диджеям. Разделили музыку на сезонную и постоянную, а актуальные подборки подняли выше в навигации.",
        "Создали виджеты с предложением перейти на следующий тариф и встроили апгрейд подписки прямо в интерфейс.",
        "Разделили отдельные плейлисты и коллекции. Добавили подсказки и описания к группам. Стоковые картинки заменили дизайнерскими обложками.",
      ],
    },
    {
      id: "landings",
      title: "Лендинги",
      paragraphs: [
        "К 2025 году один лендинг перестал описывать весь Jestei Pool. Появились новые инструменты и сценарии, а Event стал отдельным направлением. Мы активнее использовали таргетированную рекламу, поэтому разным аудиториям понадобились разные предложения. Запустили два лендинга и собрали каждый из промомодулей под свои рекламные задачи.",
      ],
    },
    {
      id: "promo",
      title: "Дизайн",
      paragraphs: [
        "Отказались от однообразного стокового контента для плейлистов, регулярных рубрик и сезонных подборок. Вместо него использовали метафоры, коллажи, иллюстрации и нейросети. Для каждой рубрики разработали свой визуальный подход.",
      ],
    },
  ],
  overlays: [
    {
      id: "logo-geometry",
      text: "Серьёзно переработали логотип Jestei Pool. Заново построили геометрию знака и описали правила его применения в интерфейсе, айдентике и промоматериалах.",
    },
    {
      id: "product-color",
      text: "Связали цвет с продуктовой навигацией. Оранжевый обозначает клубный продукт, зелёный — Event, синий — Pro. Для новых функций добавили отдельный цвет.",
    },
    {
      id: "logo-variants",
      text: "Для нового логотипа сделали полную и сокращённую версии. Задали пропорции знака и шрифтовой части и описали правила применения в разных форматах.",
    },
    {
      id: "design-system",
      text: "Новую айдентику встроили в дизайн-систему. Связали логотип, типографику и цвет с интерфейсными правилами. Теперь один визуальный язык работает и в продукте, и в коммуникации.",
    },
    {
      id: "display-type",
      text: "Добавили Druk Wide для крупных заголовков и промокоммуникации. Функциональный текст оставили на основном интерфейсном шрифте.",
    },
    {
      id: "audiences",
      text: "Разделили аудиторию на клубных диджеев, ивент-диджеев и саунд-продюсеров. Для каждой группы настроили свои продуктовые предложения, навигацию и коммуникацию.",
    },
  ],
};

const sectionExports = [
  jestei.jesteiHomeIntro,
  jestei.jesteiBrandIntro,
  jestei.jesteiInterfaceIntro,
  jestei.jesteiEditorialIntro,
  jestei.jesteiEventIntro,
  jestei.jesteiLandingsIntro,
  jestei.jesteiPromoIntro,
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Jestei editorial output baseline is explicit before CMS storage migration", () => {
  assert.equal(jestei.jesteiIntro.lead, expected.lead);
  assert.deepEqual(
    sectionExports.map((section, index) => ({ id: expected.sections[index].id, title: section.title, paragraphs: section.paragraphs })),
    expected.sections,
  );
  assert.deepEqual(
    jestei.jesteiBrandSystemGroup.items.map((item, index) => ({ id: expected.overlays[index].id, text: item.surfaceOverlay?.text })),
    expected.overlays,
  );

  const rendered = [
    renderProjectIntro(jestei.jesteiIntro),
    ...sectionExports.map((section) => renderSectionIntro(section)),
  ].join("\n");

  for (const text of [expected.lead, ...expected.sections.flatMap((section) => [section.title, ...section.paragraphs])]) {
    assert.ok(rendered.includes(text), `Rendered Jestei output must preserve: ${text}`);
  }
});

test("Jestei CMS content file owns only fixed editorial copy fields", async () => {
  const source = JSON.parse(
    await readFile(new URL("../src/content/cases/jestei-pool.json", import.meta.url), "utf8"),
  );

  assert.deepEqual(Object.keys(source).sort(), ["lead", "overlays", "sections"]);
  assert.equal(source.lead, expected.lead);
  assert.deepEqual(source.sections, expected.sections);
  assert.deepEqual(source.overlays, expected.overlays);
});

test("Jestei editorial parser rejects malformed structure and preserves code-owned ordering", async () => {
  const {
    parseJesteiEditorialContent,
    JESTEI_OVERLAY_IDS,
    JESTEI_SECTION_IDS,
  } = await import("../src/data/content/jestei-editorial.ts");

  const parsed = parseJesteiEditorialContent(clone(expected));
  assert.deepEqual(parsed.sections.map((section) => section.id), JESTEI_SECTION_IDS);
  assert.deepEqual(parsed.overlays.map((overlay) => overlay.id), JESTEI_OVERLAY_IDS);

  const reordered = clone(expected);
  reordered.sections.reverse();
  reordered.overlays.reverse();
  const normalized = parseJesteiEditorialContent(reordered);
  assert.deepEqual(normalized.sections.map((section) => section.id), JESTEI_SECTION_IDS);
  assert.deepEqual(normalized.overlays.map((overlay) => overlay.id), JESTEI_OVERLAY_IDS);

  const duplicateSection = clone(expected);
  duplicateSection.sections[6].id = "home";
  assert.throws(() => parseJesteiEditorialContent(duplicateSection), /duplicate|missing/i);

  const unknownOverlay = clone(expected);
  unknownOverlay.overlays[0].id = "filter-runtime";
  assert.throws(() => parseJesteiEditorialContent(unknownOverlay), /unexpected|unknown/i);

  const whitespace = clone(expected);
  whitespace.sections[0].paragraphs = ["   "];
  assert.throws(() => parseJesteiEditorialContent(whitespace), /non-empty|string/i);

  const presentationLeak = clone(expected);
  presentationLeak.sections[0].className = "project__section";
  assert.throws(() => parseJesteiEditorialContent(presentationLeak), /unexpected|field|key/i);
});

test("Pages CMS exposes Jestei inside Cases without route, media or runtime controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");

  assert.match(cms, /- name: cases\s+label: Кейсы\s+type: group/s);
  assert.match(cms, /- name: jestei-case[\s\S]*?path: src\/content\/cases\/jestei-pool\.json/);

  const start = cms.indexOf("      - name: jestei-case");
  assert.notEqual(start, -1);
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n      - name: ", 8);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  for (const field of ["lead", "sections", "id", "title", "paragraphs", "overlays", "text"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of [
    "entryId",
    "className",
    "layout",
    "route",
    "canonical",
    "href",
    "renderer",
    "filter",
    "before",
    "after",
    "captionView",
    "surfaceDeck",
  ]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
