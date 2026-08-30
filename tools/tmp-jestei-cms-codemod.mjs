import { readFile, writeFile } from "node:fs/promises";

const contentPath = "src/data/content/jestei-pool.ts";
const cmsPath = ".pages.yml";

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first === -1) throw new Error(`Missing exact ${label} anchor`);
  if (source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`Expected exactly one ${label} anchor`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

let content = await readFile(contentPath, "utf8");

content = replaceOnce(
  content,
  'import { getCase, getRole } from "../catalog/lookup.ts";\nimport type { MediaEntryId } from "../media/index.ts";\nimport type { LogoUsageId } from "../logos/index.ts";\n',
  'import { getCase, getRole } from "../catalog/lookup.ts";\nimport type { MediaEntryId } from "../media/index.ts";\nimport type { LogoUsageId } from "../logos/index.ts";\nimport { getJesteiEditorialOverlay, getJesteiEditorialSection, jesteiEditorialContent } from "./jestei-editorial.ts";\n',
  "Jestei editorial import",
);

content = replaceOnce(
  content,
  'const jesteiCase = getCase("jestei-pool");\nconst artDirectorRole = getRole("art-director");\n',
  'const jesteiCase = getCase("jestei-pool");\nconst artDirectorRole = getRole("art-director");\n\nconst jesteiHomeEditorial = getJesteiEditorialSection("home");\nconst jesteiBrandEditorial = getJesteiEditorialSection("brand");\nconst jesteiInterfaceEditorial = getJesteiEditorialSection("interface");\nconst jesteiEditorialEditorial = getJesteiEditorialSection("editorial");\nconst jesteiEventEditorial = getJesteiEditorialSection("event");\nconst jesteiLandingsEditorial = getJesteiEditorialSection("landings");\nconst jesteiPromoEditorial = getJesteiEditorialSection("promo");\nconst jesteiLogoGeometryOverlay = getJesteiEditorialOverlay("logo-geometry");\nconst jesteiProductColorOverlay = getJesteiEditorialOverlay("product-color");\nconst jesteiLogoVariantsOverlay = getJesteiEditorialOverlay("logo-variants");\nconst jesteiDesignSystemOverlay = getJesteiEditorialOverlay("design-system");\nconst jesteiDisplayTypeOverlay = getJesteiEditorialOverlay("display-type");\nconst jesteiAudiencesOverlay = getJesteiEditorialOverlay("audiences");\n',
  "Jestei editorial bindings",
);

content = replaceOnce(content, "  lead: jesteiCase.summary,", "  lead: jesteiEditorialContent.lead,", "Jestei lead");

const introReplacements = [
  [
    'export const jesteiHomeIntro = { title: "Персонализация", paragraphs: ["На главной Jestei Pool пользователи видят баннеры о новых релизах и обновлениях контента. Мы заменили стоковые фотографии генеративными изображениями и переработали адаптивность компонента. В результате сократили расходы на производство баннеров в 2,5 раза. Ввели показ по интересам пользователя. Например, клубные диджеи, которые не заходят в Event, больше не видят его обновления. Для регулярных рубрик разработали свои визуальные концепции, поэтому креативы стали последовательными и узнаваемыми."] } as const satisfies SectionIntroData;',
    'export const jesteiHomeIntro = { title: jesteiHomeEditorial.title, paragraphs: jesteiHomeEditorial.paragraphs } as const satisfies SectionIntroData;',
    "home intro",
  ],
  [
    'export const jesteiBrandIntro = { title: "Ребрендинг", bodyClassName: "brand-system__intro", paragraphs: ["Провели ребрендинг Jestei Pool: серьёзно переработали логотип, обновили типографику и сделали цвет частью продуктовой навигации. Новую айдентику встроили в интерфейс и дизайн-систему."] } as const satisfies SectionIntroData;',
    'export const jesteiBrandIntro = { title: jesteiBrandEditorial.title, bodyClassName: "brand-system__intro", paragraphs: jesteiBrandEditorial.paragraphs } as const satisfies SectionIntroData;',
    "brand intro",
  ],
  [
    'export const jesteiInterfaceIntro = { title: "Продукт", bodyClassName: "jestei-section-copy-list", paragraphs: ["Сгруппировали плейлисты и добавили заголовки и описания. Наняли редактора и вместе с диджеями описали больше 200 плейлистов и все жанры. Для каждой группы разработали свой стиль обложек вместо однообразных стоковых картинок.", "Разработали алгоритмические плейлисты. Они собирают популярные треки по жанру или части мероприятия и исключают музыку, которую пользователь уже слышал. Например, плейлист может предложить десять популярных треков для праймтайма или афтерпати, которые пользователь ещё не знает.", "Полностью переделали сценарий покупки подписки. Объяснили разницу между тарифами и обозначили предложения для разных сегментов своими цветами."] } as const satisfies SectionIntroData;',
    'export const jesteiInterfaceIntro = { title: jesteiInterfaceEditorial.title, bodyClassName: "jestei-section-copy-list", paragraphs: jesteiInterfaceEditorial.paragraphs } as const satisfies SectionIntroData;',
    "interface intro",
  ],
  [
    'export const jesteiEditorialIntro = { title: "Коммуникации", paragraphs: ["Собрали единые правила для tone of voice, терминологии, UX-текстов, интерфейсных текстов и редакционной работы Jestei Pool."] } as const satisfies SectionIntroData;',
    'export const jesteiEditorialIntro = { title: jesteiEditorialEditorial.title, paragraphs: jesteiEditorialEditorial.paragraphs } as const satisfies SectionIntroData;',
    "editorial intro",
  ],
  [
    'export const jesteiEventIntro = { title: "Масштабы", bodyClassName: "jestei-section-copy-list", paragraphs: ["Добавили на лендинг Canvas-анимации и интерактивные виджеты. Лента с треками знакомит пользователя с интерфейсом и инструментами сервиса прямо на странице. Там же показали плейлисты и музыкальные жанры. Анимации для клубных диджеев сделали на моей библиотеке Moves Awful.", "Спрос в ивент-диджеинге зависит от сезона, поэтому его можно прогнозировать. Мы исследовали, какие плейлисты чаще всего нужны ивент-диджеям. Разделили музыку на сезонную и постоянную, а актуальные подборки подняли выше в навигации.", "Создали виджеты с предложением перейти на следующий тариф и встроили апгрейд подписки прямо в интерфейс.", "Разделили отдельные плейлисты и коллекции. Добавили подсказки и описания к группам. Стоковые картинки заменили дизайнерскими обложками."] } as const satisfies SectionIntroData;',
    'export const jesteiEventIntro = { title: jesteiEventEditorial.title, bodyClassName: "jestei-section-copy-list", paragraphs: jesteiEventEditorial.paragraphs } as const satisfies SectionIntroData;',
    "event intro",
  ],
  [
    'export const jesteiLandingsIntro = { title: "Лендинги", paragraphs: ["К 2025 году один лендинг перестал описывать весь Jestei Pool. Появились новые инструменты и сценарии, а Event стал отдельным направлением. Мы активнее использовали таргетированную рекламу, поэтому разным аудиториям понадобились разные предложения. Запустили два лендинга и собрали каждый из промомодулей под свои рекламные задачи."] } as const satisfies SectionIntroData;',
    'export const jesteiLandingsIntro = { title: jesteiLandingsEditorial.title, paragraphs: jesteiLandingsEditorial.paragraphs } as const satisfies SectionIntroData;',
    "landings intro",
  ],
  [
    'export const jesteiPromoIntro = { title: "Дизайн", paragraphs: ["Отказались от однообразного стокового контента для плейлистов, регулярных рубрик и сезонных подборок. Вместо него использовали метафоры, коллажи, иллюстрации и нейросети. Для каждой рубрики разработали свой визуальный подход."] } as const satisfies SectionIntroData;',
    'export const jesteiPromoIntro = { title: jesteiPromoEditorial.title, paragraphs: jesteiPromoEditorial.paragraphs } as const satisfies SectionIntroData;',
    "promo intro",
  ],
];

for (const [before, after, label] of introReplacements) {
  content = replaceOnce(content, before, after, label);
}

const overlayReplacements = [
  ["Серьёзно переработали логотип Jestei Pool. Заново построили геометрию знака и описали правила его применения в интерфейсе, айдентике и промоматериалах.", "jesteiLogoGeometryOverlay.text", "logo geometry overlay"],
  ["Связали цвет с продуктовой навигацией. Оранжевый обозначает клубный продукт, зелёный — Event, синий — Pro. Для новых функций добавили отдельный цвет.", "jesteiProductColorOverlay.text", "product color overlay"],
  ["Для нового логотипа сделали полную и сокращённую версии. Задали пропорции знака и шрифтовой части и описали правила применения в разных форматах.", "jesteiLogoVariantsOverlay.text", "logo variants overlay"],
  ["Новую айдентику встроили в дизайн-систему. Связали логотип, типографику и цвет с интерфейсными правилами. Теперь один визуальный язык работает и в продукте, и в коммуникации.", "jesteiDesignSystemOverlay.text", "design system overlay"],
  ["Добавили Druk Wide для крупных заголовков и промокоммуникации. Функциональный текст оставили на основном интерфейсном шрифте.", "jesteiDisplayTypeOverlay.text", "display type overlay"],
  ["Разделили аудиторию на клубных диджеев, ивент-диджеев и саунд-продюсеров. Для каждой группы настроили свои продуктовые предложения, навигацию и коммуникацию.", "jesteiAudiencesOverlay.text", "audiences overlay"],
];
for (const [text, expression, label] of overlayReplacements) {
  content = replaceOnce(content, `text: ${JSON.stringify(text)},`, `text: ${expression},`, label);
}

const interfaceCopy = [
  "Сгруппировали плейлисты и добавили заголовки и описания. Наняли редактора и вместе с диджеями описали больше 200 плейлистов и все жанры. Для каждой группы разработали свой стиль обложек вместо однообразных стоковых картинок.",
  "Разработали алгоритмические плейлисты. Они собирают популярные треки по жанру или части мероприятия и исключают музыку, которую пользователь уже слышал. Например, плейлист может предложить десять популярных треков для праймтайма или афтерпати, которые пользователь ещё не знает.",
  "Полностью переделали сценарий покупки подписки. Объяснили разницу между тарифами и обозначили предложения для разных сегментов своими цветами.",
];
interfaceCopy.forEach((text, index) => {
  content = replaceOnce(content, `text: ${JSON.stringify(text)},`, `text: jesteiInterfaceIntro.paragraphs[${index}],`, `interface overlay ${index}`);
});

await writeFile(contentPath, content);

let cms = await readFile(cmsPath, "utf8");
const anchor = "      - name: styx-case\n";
const block = `      - name: jestei-case
        label: Jestei Pool
        type: file
        path: src/content/cases/jestei-pool.json
        format: json
        operations:
          create: false
          rename: false
          delete: false
        commit:
          templates:
            update: "content(cms): update Jestei editorial copy"
        actions:
          - name: verify-jestei-case
            label: Проверить сайт
            workflow: verify-pr.yml
            ref: current
            confirm:
              title: Запустить полную проверку сайта?
              message: Будут проверены Jestei-данные, TypeScript, сборка и browser smoke tests. Эта кнопка ничего не публикует.
              button: Проверить
        fields:
          - name: lead
            label: Вводный текст
            type: text
            required: true
            description: Вводный текст Jestei Pool. Роль, период, логотипы, маршрут и композиция остаются в коде.
          - name: sections
            label: Тексты разделов
            type: object
            required: true
            list:
              min: 7
              max: 7
              collapsible:
                collapsed: true
                summary: "{title}"
            description: Семь фиксированных текстовых разделов. Их порядок определяется кодом; layout и runtime через CMS не редактируются.
            fields:
              - name: id
                label: ID
                type: string
                required: true
                readonly: true
              - name: title
                label: Заголовок
                type: string
                required: true
              - name: paragraphs
                label: Абзацы
                type: text
                required: true
                list:
                  min: 1
          - name: overlays
            label: Тексты карточек бренд-системы
            type: object
            required: true
            list:
              min: 6
              max: 6
              collapsible:
                collapsed: true
                summary: "{id}"
            description: Только текст шести существующих hover-карточек. Media, surface, caption, layout и hover-механика остаются в TypeScript.
            fields:
              - name: id
                label: ID
                type: string
                required: true
                readonly: true
              - name: text
                label: Текст
                type: text
                required: true

`;
cms = replaceOnce(cms, anchor, block + anchor, "Jestei CMS insertion");
await writeFile(cmsPath, cms);

console.log("[tmp-jestei-cms-codemod] patched only .pages.yml and src/data/content/jestei-pool.ts");
