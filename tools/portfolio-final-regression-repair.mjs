import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  html: path.join(root, "index.html"),
  cssIndex: path.join(root, "src/styles/index.css"),
  repairCss: path.join(root, "src/styles/modules/portfolio-final-regression-repair.css"),
};

const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
const backupRoot = path.join(root, "tools/portfolio-final-regression-backups", stamp);

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const rel = path.relative(root, file);
  const out = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(file, out);
}

function countAll(source, pattern) {
  return (source.match(pattern) || []).length;
}

function findTagStart(source, tagName, id) {
  const pattern = new RegExp(`<${tagName}\\b(?=[^>]*\\bid=["']${id}["'])[^>]*>`, "i");
  const match = pattern.exec(source);
  return match ? match.index : -1;
}

function findMatchingTagEnd(source, startIndex, tagName) {
  const tagPattern = new RegExp(`</?${tagName}\\b[^>]*>`, "gi");
  tagPattern.lastIndex = startIndex;
  let depth = 0;
  let match;

  while ((match = tagPattern.exec(source))) {
    const token = match[0];
    const isClose = token.startsWith("</");
    const isSelfClosing = token.endsWith("/>");

    if (!isClose && !isSelfClosing) depth += 1;
    if (isClose) depth -= 1;

    if (depth === 0) return tagPattern.lastIndex;
  }

  return -1;
}

function extractElementById(source, tagName, id) {
  const start = findTagStart(source, tagName, id);
  if (start < 0) return { source, block: "", moved: false };

  const end = findMatchingTagEnd(source, start, tagName);
  if (end < 0) throw new Error(`cannot find closing </${tagName}> for #${id}`);

  const block = source.slice(start, end).trim();
  const next = source.slice(0, start) + source.slice(end);
  return { source: next, block, moved: true };
}

function insertAfterElementById(source, tagName, id, block) {
  const start = findTagStart(source, tagName, id);
  if (start < 0) throw new Error(`cannot find ${tagName}#${id}`);

  const end = findMatchingTagEnd(source, start, tagName);
  if (end < 0) throw new Error(`cannot find closing </${tagName}> for #${id}`);

  return `${source.slice(0, end)}\n${block}\n${source.slice(end)}`;
}

function restoreCaseChapterTitleAccents(source) {
  return source.replace(
    /<h([1-6])\b([^>]*\bclass="[^"]*\bcase-chapter-hero__title\b[^"]*"[^>]*)>([\s\S]*?)<\/h\1>/g,
    (full, level, attrs, body) => {
      if (body.includes("case-chapter-hero__title-accent") || body.includes("<span")) return full;

      const raw = body.replace(/\s+/g, " ").trim();
      if (!raw) return full;

      const words = raw.split(" ").filter(Boolean);
      if (words.length < 2) return full;

      const accent = words.pop();
      const main = words.join(" ");
      return `<h${level}${attrs}>\n<span class="case-chapter-hero__title-main">${main}</span>\n<span class="case-chapter-hero__title-accent">${accent}</span>\n</h${level}>`;
    },
  );
}

function ensureCssImport(cssIndex) {
  const importLine = '@import "./modules/portfolio-final-regression-repair.css";';
  if (cssIndex.includes(importLine)) return cssIndex;

  const anchor = '@import "./modules/portfolio-lists.css";';
  if (cssIndex.includes(anchor)) return cssIndex.replace(anchor, `${anchor}\n${importLine}`);

  return `${cssIndex.trimEnd()}\n${importLine}\n`;
}

function assertProtected(before, after) {
  const needles = [
    'href="mailto:i@lookawful.ru"',
    'ЭТО НЕ ОПЕЧАТКА, БУКВЫ S НЕТ',
    'id="hero"',
    'id="resume"',
    'data-site-header',
    'data-nav-island',
    'data-playlist-filter',
    'data-jestei-policy-marquee',
    'data-artifact-reader',
  ];

  for (const needle of needles) {
    if (before.includes(needle) && !after.includes(needle)) {
      throw new Error(`protected marker lost: ${needle}`);
    }
  }
}

function assertCounts(before, after) {
  const checks = [
    ["img", /<img\b/g],
    ["video", /<video\b/g],
    ["canvas", /<canvas\b/g],
    ["asset src", /src="\/assets\//g],
    ["asset href", /href="\/assets\//g],
    ["token pills", /\btoken-pill\b/g],
  ];

  for (const [label, pattern] of checks) {
    const a = countAll(before, pattern);
    const b = countAll(after, pattern);
    if (a !== b) throw new Error(`${label} count changed: ${a} -> ${b}`);
  }
}

backup(files.html);
backup(files.cssIndex);
backup(files.repairCss);

const beforeHtml = read(files.html);
let html = beforeHtml;

const petsExtraction = extractElementById(html, "section", "pets");
if (petsExtraction.moved) {
  html = petsExtraction.source;
  const petsBlock = petsExtraction.block;
  const styxIndex = html.indexOf('id="project-styx"');
  const shootingsIndex = html.indexOf('id="project-shootings"');
  const petsIndex = html.indexOf('id="pets"');

  const alreadyAfterStyx = petsIndex > -1 && styxIndex > -1 && shootingsIndex > -1 && styxIndex < petsIndex && petsIndex < shootingsIndex;
  if (!alreadyAfterStyx) {
    html = insertAfterElementById(html, "article", "project-styx", petsBlock);
  }
}

html = restoreCaseChapterTitleAccents(html);

assertProtected(beforeHtml, html);
assertCounts(beforeHtml, html);
write(files.html, html);

let cssIndex = read(files.cssIndex);
cssIndex = ensureCssImport(cssIndex);
write(files.cssIndex, cssIndex);

// The CSS file is shipped by the archive. Leave it in place but ensure it exists.
if (!fs.existsSync(files.repairCss)) {
  throw new Error("portfolio-final-regression-repair.css was not extracted");
}

const finalHtml = read(files.html);
const pets = finalHtml.indexOf('id="pets"');
const styx = finalHtml.indexOf('id="project-styx"');
const shootings = finalHtml.indexOf('id="project-shootings"');

if (!(styx > -1 && pets > styx && shootings > pets)) {
  throw new Error(`pets order is wrong: styx=${styx}, pets=${pets}, shootings=${shootings}`);
}

console.log("final regression repair complete");
console.log(`backup: ${backupRoot}`);
console.log(`pets order: styx=${styx}, pets=${pets}, shootings=${shootings}`);
console.log(`token pills: ${countAll(finalHtml, /\btoken-pill\b/g)}`);
console.log(`jestei title accents: ${countAll(finalHtml, /jestei-chapter-hero__title-accent/g)}`);
console.log(`case title accents: ${countAll(finalHtml, /case-chapter-hero__title-accent/g)}`);
console.log(`img: ${countAll(finalHtml, /<img\b/g)}`);
console.log(`video: ${countAll(finalHtml, /<video\b/g)}`);
console.log(`canvas: ${countAll(finalHtml, /<canvas\b/g)}`);
