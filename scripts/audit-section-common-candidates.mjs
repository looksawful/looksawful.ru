import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const rel = (...p) => path.join(root, ...p);
const exists = (p) => fs.existsSync(rel(p));
const read = (p) => fs.readFileSync(rel(p), "utf8");
const write = (p, s) => fs.writeFileSync(rel(p), s.replace(/\r\n/g, "\n"), "utf8");

const sections = [
  ["hero", "хиро"],
  ["jestei-cover", "шапка джести пула"],
  ["jestei-logo", "новый знак"],
  ["jestei-type", "новый шрифт"],
  ["jestei-color", "добавили цвет + цветовая система"],
  ["jestei-words", "нашли слова"],
  ["jestei-interface", "улучшили интерфейс"],
  ["jestei-filter", "создали систему фильтрации"],
  ["jestei-event-nav", "упростили навигацию event"],
  ["jestei-promo", "промо-организмы"],
  ["jestei-landings", "лендинговая экосистема"],
  ["jestei-tariffs", "пересобрали тарифные сценарии"],
  ["jestei-graphics", "обновили графику + графический дизайн и микс-медиа"],
  ["styx-cover", "styx jewels шапка"],
  ["styx-graphics", "графический дизайн"],
  ["styx-packaging", "бренд и упаковка"],
  ["styx-communications", "коммуникации и реклама"],
  ["styx-print", "печатная продукция"],
  ["styx-photo-art", "фото и арты"],
  ["styx-scanography", "экспериментальная + предметная сканография"],
  ["berserk-timer", "berserk timer"],
  ["awful-cases", "awful cases"],
  ["awful-audit", "awful audit"],
  ["shootings", "съёмки"],
  ["resume", "резюме"],
];

const html = exists("index.html") ? read("index.html") : "";
const cssIndex = exists("src/styles/index.css") ? read("src/styles/index.css") : "";
function fileInfo(p) {
  if (!exists(p)) return { exists: false, bytes: 0, lines: 0 };
  const s = read(p);
  return { exists: true, bytes: Buffer.byteLength(s), lines: s.split("\n").length };
}
function selectorHits(section) {
  const cssPath = `src/styles/sections/${section}.css`;
  const css = exists(cssPath) ? read(cssPath) : "";
  return {
    title: /title|heading|h1|h2|h3/i.test(css),
    lead: /lead|subtitle|copy|text/i.test(css),
    media: /media|img|video|picture|canvas|gallery/i.test(css),
    grid: /grid|columns|flex|rail|masonry/i.test(css),
    mobile: /@media/i.test(css),
  };
}
function behaviorHooks(section) {
  const re = new RegExp(`data-section=["']${section}["']([\\s\\S]{0,5000})`, "i");
  const m = html.match(re)?.[1] || "";
  return [
    "data-lightbox-item",
    "data-media-item",
    "data-policy-book",
    "data-playlist-filter-embed",
    "data-visual-demo",
    "data-three-scene",
    "data-pet-preview",
    "data-animation",
    "data-nav-chip",
  ].filter((hook) => m.includes(hook));
}

const sectionReport = ["# section component audit", "", "strict rule: if a style can change in one section, it stays local.", ""];
for (const [name, title] of sections) {
  const cssPath = `src/styles/sections/${name}.css`;
  const info = fileInfo(cssPath);
  const hooks = behaviorHooks(name);
  const hits = selectorHits(name);
  sectionReport.push(`## ${sections.findIndex(([n]) => n === name) + 1}. ${name}`);
  sectionReport.push(`- title: ${title}`);
  sectionReport.push(`- id/class target: ${name}`);
  sectionReport.push(`- css: ${cssPath}`);
  sectionReport.push(`- css exists: ${info.exists ? "yes" : "no"}`);
  sectionReport.push(`- css size: ${info.bytes} bytes / ${info.lines} lines`);
  sectionReport.push(`- behavior hooks found near section: ${hooks.length ? hooks.join(", ") : "none detected"}`);
  sectionReport.push(`- local-only rules: title, lead, section spacing, media placement, mobile behavior, section-specific cards/grids/rails.`);
  const similar = [];
  if (hits.title) similar.push("title-like rules");
  if (hits.media) similar.push("media-like rules");
  if (hits.grid) similar.push("grid/rail rules");
  if (hits.mobile) similar.push("responsive rules");
  sectionReport.push(`- similar-but-not-common: ${similar.length ? similar.join(", ") : "not enough local css yet"}. keep local unless exact identical primitive is proven.`);
  sectionReport.push(`- risk: do not repair this section through #showcase, .case-chapter, .content-section, .media-group, or another section namespace.`);
  sectionReport.push("");
}
write("SECTION_COMPONENT_AUDIT.md", sectionReport.join("\n"));

const candidates = [
  ["box-sizing reset", "base/reset.css", "yes", "no", "no", "move to base", "raw reset; not section composition"],
  ["font-family", "base/typography.css", "yes", "rarely", "low", "move to base", "site-wide font default only"],
  ["raw color tokens", "base/tokens.css", "yes", "no", "no", "move to base", "values only; section usage stays local"],
  ["raw radius tokens", "base/tokens.css", "yes", "no", "no", "move to base", "values only; not component shape"],
  ["raw shadow tokens", "base/tokens.css", "yes", "no", "no", "move to base", "values only; section decides when to use"],
  ["visually-hidden", "base/accessibility", "yes", "no", "no", "move to base", "accessibility utility"],
  ["focus-visible", "base/interaction", "mostly", "maybe", "medium", "move to base only if generic", "component-specific focus rings stay local"],
  ["section title", "all sections", "no", "yes", "high", "keep local", "headings differ by section"],
  ["section lead", "all sections", "no", "yes", "high", "keep local", "width, position and rhythm differ"],
  ["media grid", "media sections", "no", "yes", "high", "keep local", "gallery compositions differ"],
  ["pet cards", "berserk/awful-cases/awful-audit", "no", "yes", "high", "keep local", "each pet is its own section"],
  ["token cards", "jestei-color", "no", "yes", "high", "keep local", "only color section owns this pattern"],
  ["policy book", "jestei-words", "yes as component", "yes shell only", "medium", "move internals to component, shell local", "interactive component can be shared; placement stays local"],
  ["playlist filter", "jestei-filter", "yes as component", "yes shell only", "medium", "keep internals, shell local", "filter internals are external component; section controls placement"],
  ["site header", "global", "yes", "no", "low", "move to component", "not a showcase section"],
];
const common = [
  "# common style candidates",
  "",
  "strict rule: if there is any override risk, keep local.",
  "",
  "| candidate | files/sections | exact same? | can change independently? | override risk? | decision | reason |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...candidates.map((row) => `| ${row.join(" | ")} |`),
  "",
  "## result",
  "Do not create .section-title, .section-lead, .media-grid, .project-card, .pet-card, .case-section, .content-section, .token-list, .gallery, or .rail as shared layout APIs.",
].join("\n");
write("COMMON_STYLE_CANDIDATES.md", common + "\n");

const checks = [];
const ok = (name, pass) => checks.push({ name, pass });
for (const [name] of sections) ok(`${name} css exists`, exists(`src/styles/sections/${name}.css`));
ok("SECTION_COMPONENT_AUDIT.md exists", exists("SECTION_COMPONENT_AUDIT.md"));
ok("COMMON_STYLE_CANDIDATES.md exists", exists("COMMON_STYLE_CANDIDATES.md"));
ok("index imports section css", cssIndex.includes("./sections/hero.css"));
ok("no refactor-round in css index", !/refactor-round/.test(cssIndex));
ok("no shared pets-index section css expected", !exists("src/styles/sections/pets-index.css"));
console.log("# section common audit\n");
for (const item of checks) console.log(`- ${item.pass ? "ok" : "fail"}: ${item.name}`);
const failed = checks.filter((item) => !item.pass);
if (failed.length) process.exitCode = 1;
