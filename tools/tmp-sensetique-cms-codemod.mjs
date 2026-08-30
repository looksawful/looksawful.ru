import { readFile, writeFile } from "node:fs/promises";

const contentPath = new URL("../src/data/content/sensetique.ts", import.meta.url);
const cmsPath = new URL("../.pages.yml", import.meta.url);

let content = await readFile(contentPath, "utf8");
let cms = await readFile(cmsPath, "utf8");

if (content.includes('from "./sensetique-editorial.ts"')) {
  console.log("[sensetique-codemod] already applied");
  process.exit(0);
}

function replaceOnce(source, oldValue, newValue, label) {
  const first = source.indexOf(oldValue);
  if (first === -1) throw new Error(`Missing expected ${label}`);
  if (source.indexOf(oldValue, first + oldValue.length) !== -1) throw new Error(`Expected exactly one ${label}`);
  return source.slice(0, first) + newValue + source.slice(first + oldValue.length);
}

function exportRange(source, exportName) {
  const start = source.indexOf(`export const ${exportName} =`);
  if (start === -1) throw new Error(`Missing export ${exportName}`);
  const next = source.indexOf("\nexport const ", start + 1);
  return { start, end: next === -1 ? source.length : next };
}

function replaceInExport(source, exportName, oldValue, newValue, label) {
  const { start, end } = exportRange(source, exportName);
  const before = source.slice(0, start);
  const block = source.slice(start, end);
  const after = source.slice(end);
  return before + replaceOnce(block, oldValue, newValue, `${exportName} ${label}`) + after;
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error("Unbalanced object literal");
}

function replaceObjectPropertyInExport(source, exportName, propertyName, replacement, expectedSnippet) {
  const { start, end } = exportRange(source, exportName);
  const block = source.slice(start, end);
  if (!block.includes(expectedSnippet)) throw new Error(`Unexpected ${exportName} ${propertyName} baseline`);
  const patterns = [`${propertyName}: {`, `"${propertyName}": {`];
  let propertyIndex = -1;
  let token = "";
  for (const pattern of patterns) {
    const index = block.indexOf(pattern);
    if (index !== -1) {
      if (propertyIndex !== -1) throw new Error(`Ambiguous ${exportName}.${propertyName}`);
      propertyIndex = index;
      token = pattern;
    }
  }
  if (propertyIndex === -1) throw new Error(`Missing ${exportName}.${propertyName}`);
  const open = block.indexOf("{", propertyIndex + token.length - 1);
  const close = findMatchingBrace(block, open);
  const nextBlock = block.slice(0, open) + replacement + block.slice(close + 1);
  return source.slice(0, start) + nextBlock + source.slice(end);
}

content = replaceOnce(
  content,
  'import type { LogoUsageId } from "../logos/index.ts";\n',
  'import type { LogoUsageId } from "../logos/index.ts";\nimport {\n  getSensetiqueEditorialCredit,\n  getSensetiqueEditorialNote,\n  getSensetiqueEditorialSection,\n  sensetiqueEditorialContent,\n} from "./sensetique-editorial.ts";\n',
  "Sensetique editorial import",
);

content = replaceInExport(content, "sensetiqueIntro", '  role: "Основатель",\n  period: "2017–2018",\n\n  lead: "Запустил и управлял московской фотостудией и продакшеном для моды, рекламы и визуального контента. Собирал команду, продюсировал съёмки и организовывал производство.",', '  role: sensetiqueEditorialContent.intro.role,\n  period: sensetiqueEditorialContent.intro.period,\n\n  lead: sensetiqueEditorialContent.intro.lead,', "intro copy");

for (const [exportName, id, title, paragraph] of [
  ["sensetiqueStudioIntro", "studio", "Студия", "В 2018 году закончили строительство студии с тремя съёмочными пространствами в здании завода на улице Дмитрия Ульянова, 42."],
  ["sensetiqueProductionIntro", "production", "Продакшен", "В 2017 году я запустил продакшен-агентство полного цикла Moch Fashn. Мы продюсировали и снимали фотосъёмки, занимались SMM и рекламой, разрабатывали и дорабатывали сайты, администрировали интернет-магазины. Снимали лукбуки и кампейны, стилизовали съёмки и делали редизайн сайтов для локальных брендов одежды. В 2018 году провели ребрендинг и масштабировали проект: начали строить коммерческую фотостудию и работать субподрядчиками крупных продакшен-агентств. Организовывали кастинги и логистику, предоставляли стилистов и ассистентов для рекламных проектов."],
]) {
  content = replaceInExport(content, exportName, `  title: "${title}",\n\n  paragraphs: [\n    "${paragraph}",\n  ],`, `  title: getSensetiqueEditorialSection("${id}").title,\n\n  paragraphs: getSensetiqueEditorialSection("${id}").paragraphs,`, "section copy");
}

const creditMappings = [
  ["sensetiqueBuro247Group", "buro247", "Фотограф Андрей Рапуто", "lines"],
  ["sensetiqueOlovoBookletGroup", "olovo-booklet", "Дизайн буклета Olovo Moscow.", "title"],
  ["sensetiqueTatianaNikishinaEditorialGroup", "tatiana-nikishina", "Фотограф Татьяна Никишина", "lines"],
  ["sensetiqueKatyaKnyazevaEditorialGroup", "katya-knyazeva", "Фотограф Катя Князева", "lines"],
  ["sensetiqueYuriIvanovEditorialGroup", "yuri-ivanov", "Фотограф Юрий Иванов", "lines"],
  ["sensetiqueHarshLightStrip", "harsh-light", "HARSH LIGHT, 2018.", "both"],
  ["sensetiqueRaputoEditorialStrip", "raputo-editorial", "Фотограф Андрей Рапуто", "lines"],
  ["sensetiqueYoungPioneerSequence", "young-pioneer-sequence", "Young-pioneer", "both"],
  ["sensetiqueKrasotaDressStrip", "krasota-dress", "Фотограф Дарья Сеничева", "lines"],
  ["sensetiqueOlovoCampaignStrip", "olovo-campaign", "Фотограф Никита Игнатов", "lines"],
  ["sensetiqueOlovoLookbook2016Reel", "olovo-lookbook-2016", "Фотограф Никита Игнатов", "lines"],
  ["sensetiqueOlovoLookbook2018Reel", "olovo-lookbook-2018", "Фотограф Дарья Сеничева", "lines"],
  ["sensetiqueInnaHonourReel", "inna-honour", "Фотограф Дарья Сеничева", "lines"],
  ["sensetiqueOlovoArchitectureStrip", "olovo-architecture", "Архитектурные фотографии для брендбука Olovo Moscow.", "both"],
  ["sensetiqueChapurinBentoGroup", "chapurin", "Фотограф Андрей Рапуто", "lines"],
  ["sensetiqueYoungPioneerStrip", "young-pioneer-strip", "Young-pioneer", "both"],
  ["sensetiqueDaniilKorotechenkovSequence", "daniil-korotechenkov", "Фотограф Даниил Коротеченков", "lines"],
  ["sensetiqueTatianaNikishinaSupplementalReel", "tatiana-nikishina-supplemental", "Фотограф Татьяна Никишина", "lines"],
  ["sensetiqueWoodMetalPanicStrip", "wood-metal-panic", "Wood.Metal.PANIC!", "both"],
  ["sensetiqueIvanKrushinskyEditorialStrip", "ivan-krushinsky", "Фотограф Иван Крушинский", "lines"],
  ["sensetiqueEditorialProductionReel", "editorial-production", "Стилист Мария Жукова", "lines"],
  ["sensetiqueDigitalFearPageFlip", "digital-fear", "Digital-fear-of-love — адверториал для ювелирного бренда MIMI MOSCOW", "both"],
];

for (const [exportName, id, snippet, kind] of creditMappings) {
  const credit = `getSensetiqueEditorialCredit("${id}")`;
  const replacement = kind === "title"
    ? `{ title: ${credit}.title! }`
    : kind === "lines"
      ? `{ lines: ${credit}.lines! }`
      : `{ title: ${credit}.title!, lines: ${credit}.lines! }`;
  content = replaceObjectPropertyInExport(content, exportName, "credits", replacement, snippet);
}

content = replaceObjectPropertyInExport(
  content,
  "sensetiqueBuro247Group",
  "note",
  '{ kind: "editorial", text: getSensetiqueEditorialNote("buro247").text }',
  "Для Bureau 24/7 сделали спецпроект",
);
content = replaceObjectPropertyInExport(
  content,
  "sensetiqueOlovoLookbook2016Reel",
  "note",
  '{ kind: "editorial", text: getSensetiqueEditorialNote("olovo-lookbook-2016").text }',
  "С брендами работали на постоянной основе",
);

const cmsInsertBefore = "\n  - name: client-logo-visibility\n";
if (!cms.includes("      - name: styx-case\n")) throw new Error("Missing existing Styx cases group");
if (cms.includes("      - name: sensetique-case\n")) throw new Error("Sensetique CMS entry already exists");
const sensetiqueCms = `\n      - name: sensetique-case\n        label: Sensetique\n        type: file\n        path: src/content/cases/sensetique.json\n        format: json\n        operations:\n          create: false\n          rename: false\n          delete: false\n        commit:\n          templates:\n            update: "content(cms): update Sensetique editorial copy"\n        actions:\n          - name: verify-sensetique-case\n            label: Проверить сайт\n            workflow: verify-pr.yml\n            ref: current\n            confirm:\n              title: Запустить полную проверку сайта?\n              message: Будут проверены Sensetique-данные, TypeScript, сборка и browser smoke tests. Эта кнопка ничего не публикует.\n              button: Проверить\n        fields:\n          - name: intro\n            label: Вводные данные\n            type: object\n            required: true\n            fields:\n              - name: role\n                label: Роль\n                type: string\n                required: true\n              - name: period\n                label: Период\n                type: string\n                required: true\n              - name: lead\n                label: Вводный текст\n                type: text\n                required: true\n          - name: sections\n            label: Тексты разделов\n            type: object\n            required: true\n            list:\n              min: 2\n              max: 2\n              collapsible:\n                collapsed: true\n                summary: "{title}"\n            description: Два фиксированных текстовых раздела. Их порядок на сайте определяется кодом.\n            fields:\n              - name: id\n                label: ID\n                type: string\n                required: true\n                readonly: true\n              - name: title\n                label: Заголовок\n                type: string\n                required: true\n              - name: paragraphs\n                label: Абзацы\n                type: text\n                required: true\n                list:\n                  min: 1\n          - name: credits\n            label: Кредиты и подписи серий\n            type: object\n            required: true\n            list:\n              min: 22\n              max: 22\n              collapsible:\n                collapsed: true\n                summary: "{id}"\n            description: Фиксированные подписи существующих серий. Хотя бы title или lines должны оставаться заполненными; media и порядок остаются в коде.\n            fields:\n              - name: id\n                label: ID\n                type: string\n                required: true\n                readonly: true\n              - name: title\n                label: Заголовок\n                type: string\n              - name: lines\n                label: Строки кредитов\n                type: string\n                list: true\n          - name: notes\n            label: Редакторские примечания\n            type: object\n            required: true\n            list:\n              min: 2\n              max: 2\n              collapsible:\n                collapsed: true\n                summary: "{id}"\n            fields:\n              - name: id\n                label: ID\n                type: string\n                required: true\n                readonly: true\n              - name: text\n                label: Текст\n                type: text\n                required: true\n`;
cms = replaceOnce(cms, cmsInsertBefore, `${sensetiqueCms}${cmsInsertBefore}`, "Sensetique CMS insertion point");

await writeFile(contentPath, content);
await writeFile(cmsPath, cms);
console.log("[sensetique-codemod] updated sensetique.ts and .pages.yml");
