import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexPath = path.join(root, "index.html");
const indexCssPath = path.join(root, "src/styles/index.css");
const readingCssPath = path.join(root, "src/styles/modules/portfolio-reading.css");
const listsCssPath = path.join(root, "src/styles/modules/portfolio-lists.css");
const backupRoot = path.join(root, "tools/portfolio-list-backups", timestamp());
const importLine = '@import "./modules/portfolio-lists.css";';

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function backup(filePath) {
  if (!fs.existsSync(filePath)) return;
  const relative = path.relative(root, filePath);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
}

function count(pattern, text) {
  return (text.match(pattern) || []).length;
}

function normalizeClassValue(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

function setClass(tag, className) {
  if (/\sclass="[^"]*"/.test(tag)) {
    return tag.replace(/\sclass="[^"]*"/, ` class="${className}"`);
  }
  return tag.replace(/>$/, ` class="${className}">`);
}

function addAttribute(tag, attr) {
  const name = attr.split("=")[0].trim();
  const re = new RegExp(`\\s${name}(?:=|\\s|>)`);
  if (re.test(tag)) return tag;
  return tag.replace(/>$/, ` ${attr}>`);
}

function stripTags(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeTextSections(html) {
  let sectionCount = 0;
  let articleCount = 0;
  let duplicateCount = 0;
  let listCardCount = 0;

  const result = html.replace(/<section\b([^>]*class="[^"]*\btext-sections\b[^"]*"[^>]*)>([\s\S]*?)<\/section>/g, (match, attrs, body) => {
    sectionCount += 1;

    let openTag = `<section${attrs}>`;
    openTag = openTag.replace(/class="([^"]*)"/, (_, classValue) => {
      const next = normalizeClassValue(classValue
        .replace(/\btext-sections\b/g, "")
        .replace(/\breading-sections\b/g, "")
        .trim());
      return `class="${normalizeClassValue(`${next} reading-sections`)}"`;
    });
    openTag = addAttribute(openTag, "data-reading-sections");

    body = body
      .replace(/<article\b([^>]*class="[^"]*\blist-card\b[^"]*"[^>]*)>/g, (articleTag) => {
        listCardCount += 1;
        articleCount += 1;
        return addAttribute(setClass(articleTag, "reading-entry"), "data-reading-entry");
      })
      .replace(/<article\b([^>]*class="[^"]*\btext-section\b[^"]*"[^>]*)>/g, (articleTag) => {
        articleCount += 1;
        return addAttribute(setClass(articleTag, "reading-entry"), "data-reading-entry");
      })
      .replace(/class="(?:text-section__title|list-card__title)"/g, 'class="reading-entry__title"')
      .replace(/class="list-card__list"/g, 'class="reading-entry__list"')
      .replace(/class="list-card__text"/g, 'class="reading-entry__text"')
      .replace(/<p(?![^>]*class=)/g, '<p class="reading-entry__text"');

    const seen = new Set();
    body = body.replace(/<article\b[^>]*class="[^"]*\breading-entry\b[^"]*"[^>]*>[\s\S]*?<\/article>/g, (article) => {
      const fingerprint = stripTags(article);
      if (fingerprint && seen.has(fingerprint)) {
        duplicateCount += 1;
        return "";
      }
      seen.add(fingerprint);
      return article;
    });

    return `${openTag}${body}</section>`;
  });

  return { html: result, sectionCount, articleCount, duplicateCount, listCardCount };
}

function normalizeListCardSections(html) {
  let sectionCount = 0;
  let articleCount = 0;
  let duplicateCount = 0;

  const result = html.replace(/<section\b([^>]*class="[^"]*\blist-cards\b[^"]*"[^>]*)>([\s\S]*?)<\/section>/g, (match, attrs, body) => {
    sectionCount += 1;

    let openTag = `<section${attrs}>`;
    openTag = openTag.replace(/class="([^"]*)"/, (_, classValue) => {
      const next = normalizeClassValue(classValue
        .replace(/\blist-cards\b/g, "")
        .replace(/\blist-cards--[\w-]+\b/g, "")
        .replace(/\breading-sections\b/g, "")
        .trim());
      return `class="${normalizeClassValue(`${next} reading-sections`)}"`;
    });
    openTag = addAttribute(openTag, "data-reading-sections");

    body = body
      .replace(/<article\b([^>]*class="[^"]*\blist-card\b[^"]*"[^>]*)>/g, (articleTag) => {
        articleCount += 1;
        return addAttribute(setClass(articleTag, "reading-entry"), "data-reading-entry");
      })
      .replace(/<span\b[^>]*class="[^"]*\blist-card__title-divider\b[^"]*"[^>]*><\/span>\s*/g, "")
      .replace(/class="(?:text-section__title|list-card__title)"/g, 'class="reading-entry__title"')
      .replace(/class="list-card__list"/g, 'class="reading-entry__list"')
      .replace(/class="list-card__text"/g, 'class="reading-entry__text"');

    const seen = new Set();
    body = body.replace(/<article\b[^>]*class="[^"]*\breading-entry\b[^"]*"[^>]*>[\s\S]*?<\/article>/g, (article) => {
      const fingerprint = stripTags(article);
      if (fingerprint && seen.has(fingerprint)) {
        duplicateCount += 1;
        return "";
      }
      seen.add(fingerprint);
      return article;
    });

    return `${openTag}${body}</section>`;
  });

  return { html: result, sectionCount, articleCount, duplicateCount };
}

function normalizePlainListsInBodies(html) {
  let transformed = 0;
  const protectedListClass = /\b(?:token-group__list|chips|project-responsibilities|responsibility-card__list|project-skill-cloud__list|portfolio-toc__panel)\b/;

  const result = html.replace(/<div\b([^>]*class="[^"]*\bcase-chapter__body\b[^"]*"[^>]*)>([\s\S]*?)<\/div>/g, (match, attrs, body) => {
    body = body.replace(/<(ul|ol)\b([^>]*)>/g, (listTag, tagName, listAttrs) => {
      if (/class="([^"]*)"/.test(listAttrs)) {
        const classValue = listAttrs.match(/class="([^"]*)"/)[1];
        if (protectedListClass.test(classValue)) return listTag;
        if (/\breading-entry__list\b/.test(classValue)) return listTag;
        const nextClass = normalizeClassValue(`${classValue} reading-list`);
        transformed += 1;
        return `<${tagName}${listAttrs.replace(/class="[^"]*"/, `class="${nextClass}"`)} data-reading-list>`;
      }
      transformed += 1;
      return `<${tagName}${listAttrs} class="reading-list" data-reading-list>`;
    });
    return `<div${attrs}>${body}</div>`;
  });

  return { html: result, transformed };
}

function connectCss() {
  backup(indexCssPath);
  let css = fs.readFileSync(indexCssPath, "utf8");
  css = css
    .split(/\r?\n/)
    .filter((line) => !line.includes("portfolio-lists.css"))
    .join("\n")
    .trimEnd();

  const lines = css.split("\n");
  const afterReading = lines.findIndex((line) => line.includes("portfolio-reading.css"));
  if (afterReading >= 0) {
    lines.splice(afterReading + 1, 0, importLine);
  } else {
    let lastImport = -1;
    for (let i = 0; i < lines.length; i += 1) {
      if (/^\s*@import\s+/.test(lines[i])) lastImport = i;
    }
    lines.splice(lastImport + 1, 0, importLine);
  }
  fs.writeFileSync(indexCssPath, `${lines.join("\n").trimEnd()}\n`, "utf8");
}

if (!fs.existsSync(indexPath)) throw new Error(`index.html not found: ${indexPath}`);
if (!fs.existsSync(indexCssPath)) throw new Error(`index.css not found: ${indexCssPath}`);

backup(indexPath);
backup(readingCssPath);
backup(listsCssPath);

const before = fs.readFileSync(indexPath, "utf8");
const beforeCounts = {
  img: count(/<img\b/g, before),
  video: count(/<video\b/g, before),
  canvas: count(/<canvas\b/g, before),
  srcAssets: count(/src="\/assets\//g, before),
  hrefAssets: count(/href="\/assets\//g, before),
};

let { html, sectionCount, articleCount, duplicateCount, listCardCount } = normalizeTextSections(before);
const listCards = normalizeListCardSections(html);
html = listCards.html;
const plain = normalizePlainListsInBodies(html);
html = plain.html;

const afterCounts = {
  img: count(/<img\b/g, html),
  video: count(/<video\b/g, html),
  canvas: count(/<canvas\b/g, html),
  srcAssets: count(/src="\/assets\//g, html),
  hrefAssets: count(/href="\/assets\//g, html),
};

for (const key of Object.keys(beforeCounts)) {
  if (beforeCounts[key] !== afterCounts[key]) {
    throw new Error(`${key} count changed: ${beforeCounts[key]} -> ${afterCounts[key]}`);
  }
}

fs.writeFileSync(indexPath, html, "utf8");
connectCss();

console.log(`text sections normalized: ${sectionCount}`);
console.log(`text/list articles normalized: ${articleCount}`);
console.log(`list cards inside text-sections normalized: ${listCardCount}`);
console.log(`list-card sections normalized: ${listCards.sectionCount}`);
console.log(`list-card articles normalized: ${listCards.articleCount}`);
console.log(`exact duplicate reading entries removed: ${duplicateCount + listCards.duplicateCount}`);
console.log(`plain lists marked: ${plain.transformed}`);
console.log(`backup: ${backupRoot}`);
