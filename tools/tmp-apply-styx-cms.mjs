import { readFile, writeFile } from "node:fs/promises";

const styxPath = new URL("../src/data/content/styx.ts", import.meta.url);
const cmsPath = new URL("../.pages.yml", import.meta.url);

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, got ${count}`);
  return source.replace(before, after);
}

let styx = await readFile(styxPath, "utf8");

styx = replaceOnce(
  styx,
  'import type { LogoUsageId } from "../logos/index.ts";\n',
  'import type { LogoUsageId } from "../logos/index.ts";\n\nimport { getStyxEditorialCredit, getStyxEditorialSection, styxEditorialContent } from "./styx-editorial.ts";\n',
  "Styx editorial import",
);

styx = replaceOnce(
  styx,
  'const designerRole = getRole("designer");\n',
  'const designerRole = getRole("designer");\n\nconst styxBrandEditorial = getStyxEditorialSection("brand");\nconst styxProductionEditorial = getStyxEditorialSection("production");\nconst styxScanographyEditorial = getStyxEditorialSection("scanography");\nconst styxShootingsEditorial = getStyxEditorialSection("shootings");\nconst styxLookbookEditorial = getStyxEditorialSection("lookbook");\nconst styxBrandLookbook2023Credit = getStyxEditorialCredit("brand-lookbook-2023");\nconst styxScanography2021Credit = getStyxEditorialCredit("scanography-2021");\nconst styxLookbook2025Credit = getStyxEditorialCredit("lookbook-2025");\n',
  "Styx normalized copy constants",
);

styx = replaceOnce(
  styx,
  '  lead: "Возглавил работу над визуальной системой московского бренда украшений, аксессуаров и одежды, вдохновлённого готической романтикой и лавкрафтовским ужасом.",',
  '  lead: styxEditorialContent.lead,',
  "Styx lead",
);

const sectionReplacements = [
  [
    `export const styxBrandIntro = {\n  title: "Айдентика",\n\n  paragraphs: [\n    "С нуля собрал визуальную систему Styx: разработал логотип, фирменный стиль, упаковку, печатные материалы, оформление соцсетей, рекламные публикации и баннеры.",\n  ],\n} as const satisfies SectionIntroData;`,
    `export const styxBrandIntro = {\n  title: styxBrandEditorial.title,\n  paragraphs: styxBrandEditorial.paragraphs,\n} as const satisfies SectionIntroData;`,
    "Styx brand intro",
  ],
  [
    `export const styxProductionIntro = {\n  title: "Продакшен",\n\n  paragraphs: [\n    "Продюсировал и снимал кампейны, лукбуки и каталоги Styx. Готовил материал для рекламы, каталогов и соцсетей, делал техническую, художественную и экспериментальную обработку фотографий и создавал сканографические анимации и арты.",\n  ],\n} as const satisfies SectionIntroData;`,
    `export const styxProductionIntro = {\n  title: styxProductionEditorial.title,\n  paragraphs: styxProductionEditorial.paragraphs,\n} as const satisfies SectionIntroData;`,
    "Styx production intro",
  ],
  [
    `export const styxScanographyIntro = {\n  title: "Сканографии",\n\n  paragraphs: [\n    "Для Styx придумал собственную технику сканографии. Сканировал один объект разными сканерами и вручную монтировал кадры, поэтому искажения и артефакты возникали при сканировании, а не имитировались цифровой обработкой.",\n  ],\n} as const satisfies SectionIntroData;`,
    `export const styxScanographyIntro = {\n  title: styxScanographyEditorial.title,\n  paragraphs: styxScanographyEditorial.paragraphs,\n} as const satisfies SectionIntroData;`,
    "Styx scanography intro",
  ],
  [
    `export const styxShootingsIntro = {\n  title: "Съёмки",\n\n  paragraphs: [\n    "Продюсировал и снимал для Styx лукбуки, кампейны и коллаборации. Из отснятого материала собирал каталожные, рекламные и экспериментальные визуалы бренда.",\n  ],\n} as const satisfies SectionIntroData;`,
    `export const styxShootingsIntro = {\n  title: styxShootingsEditorial.title,\n  paragraphs: styxShootingsEditorial.paragraphs,\n} as const satisfies SectionIntroData;`,
    "Styx shootings intro",
  ],
  [
    `export const styxLookbookIntro = {\n  title: "Лукбук",\n\n  paragraphs: ["Снял лукбук Styx Jewel 2025 года."],\n} as const satisfies SectionIntroData;`,
    `export const styxLookbookIntro = {\n  title: styxLookbookEditorial.title,\n  paragraphs: styxLookbookEditorial.paragraphs,\n} as const satisfies SectionIntroData;`,
    "Styx lookbook intro",
  ],
];

for (const [before, after, label] of sectionReplacements) styx = replaceOnce(styx, before, after, label);

styx = replaceOnce(styx, '      "title": "Лукбук Styx Jewels, 2023."', '      "title": styxBrandLookbook2023Credit.title', "Styx 2023 credit");
styx = replaceOnce(styx, '      "title": "Сканография, 2021."', '      "title": styxScanography2021Credit.title', "Styx scanography credit");
styx = replaceOnce(styx, '      "title": "Лукбук Styx Jewels, 2025."', '      "title": styxLookbook2025Credit.title', "Styx 2025 credit");

await writeFile(styxPath, styx);

let cms = await readFile(cmsPath, "utf8");
const marker = "\n  - name: client-logo-visibility\n";
const casesGroup = `\n  - name: cases\n    label: Кейсы\n    type: group\n    items:\n      - name: styx-case\n        label: Styx\n        type: file\n        path: src/content/cases/styx.json\n        format: json\n        operations:\n          create: false\n          rename: false\n          delete: false\n        commit:\n          templates:\n            update: "content(cms): update Styx editorial copy"\n        actions:\n          - name: verify-styx-case\n            label: Проверить сайт\n            workflow: verify-pr.yml\n            ref: current\n            confirm:\n              title: Запустить полную проверку сайта?\n              message: Будут проверены Styx-данные, TypeScript, сборка и browser smoke tests. Эта кнопка ничего не публикует.\n              button: Проверить\n        fields:\n          - name: lead\n            label: Вводный текст\n            type: text\n            required: true\n            description: Текст вводного абзаца Styx. Логотип, роль, период, маршрут и композиция остаются в коде.\n          - name: sections\n            label: Тексты разделов\n            type: object\n            required: true\n            list:\n              min: 5\n              max: 5\n              collapsible:\n                collapsed: true\n                summary: "{title}"\n            description: Пять фиксированных текстовых разделов. Их порядок на сайте определяется кодом, а не порядком в CMS.\n            fields:\n              - name: id\n                label: ID\n                type: string\n                required: true\n                readonly: true\n                description: Стабильный ID раздела. Не изменяется через CMS.\n              - name: title\n                label: Заголовок\n                type: string\n                required: true\n              - name: paragraphs\n                label: Абзацы\n                type: text\n                required: true\n                list:\n                  min: 1\n                description: Обычный текст. Media, layout, классы и runtime остаются в TypeScript.\n          - name: credits\n            label: Подписи серий\n            type: object\n            required: true\n            list:\n              min: 3\n              max: 3\n              collapsible:\n                collapsed: true\n                summary: "{title}"\n            description: Редактируемые заголовки трёх существующих серий; media и порядок остаются в коде.\n            fields:\n              - name: id\n                label: ID\n                type: string\n                required: true\n                readonly: true\n                description: Стабильный ID подписи. Не изменяется через CMS.\n              - name: title\n                label: Подпись\n                type: string\n                required: true\n`;

cms = replaceOnce(cms, marker, `${casesGroup}${marker}`, "Pages CMS cases group insertion");
await writeFile(cmsPath, cms);
