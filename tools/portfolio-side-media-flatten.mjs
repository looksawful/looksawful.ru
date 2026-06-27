import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const backupRoot = path.join(root, "tools", "portfolio-side-media-backups", stamp);

const targets = [
  "index.html",
  "src/styles/index.css",
  "src/styles/modules/portfolio-gallery.css",
  "src/styles/modules/portfolio-content-sections.css",
];

function read(file) {
  return fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), "utf8") : "";
}

function write(file, value) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, value, "utf8");
}

function backup(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  const dest = path.join(backupRoot, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(full, dest);
}

function count(pattern, text) {
  return (text.match(pattern) || []).length;
}

function normalizeClassList(classValue) {
  const input = classValue.trim().split(/\s+/).filter(Boolean);
  const hadTokens = input.includes("media-row--tokens");
  const drop = new Set(["media-row", "media-row--tokens", "media-system", "media-system--row"]);
  const output = [];

  for (const item of input) {
    if (drop.has(item)) continue;
    if (/^media-row--/.test(item)) continue;
    if (/^media-system--/.test(item)) continue;
    output.push(item);
  }

  for (const item of ["content-section", "content-section--text-media"]) {
    if (!output.includes(item)) output.push(item);
  }

  if (hadTokens && !output.includes("content-section--tokens")) {
    output.push("content-section--tokens");
  }

  return output.join(" ");
}

function normalizeTextBlockClasses(html) {
  return html.replace(/class=(['"])([^'"]*\btext-block\b[^'"]*)\1/g, (match, quote, value) => {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (!parts.includes("content-section__text")) parts.push("content-section__text");
    return `class=${quote}${parts.join(" ")}${quote}`;
  });
}

function normalizeSideRows(html) {
  const tagPattern = /<(?<tag>div|section)(?<before>[^<>]*?)\bclass=(?<quote>['"])(?<classes>[^'"]*(?:\bmedia-row\b|\bmedia-system--row\b)[^'"]*)\k<quote>(?<after>[^<>]*?)>/g;
  let changed = 0;

  html = html.replace(tagPattern, (match, tag, before, quote, classes, after) => {
    const next = normalizeClassList(classes);
    let attrs = `${before} class=${quote}${next}${quote}${after}`;
    attrs = attrs.replace(/\s+data-media-gallery=(['"])row\1/g, "");
    if (!/\sdata-content-section=/.test(attrs)) attrs += ' data-content-section="text-media"';
    changed += 1;
    return `<${tag}${attrs}>`;
  });

  html = normalizeTextBlockClasses(html);

  // Remove empty text/media rows left by earlier transformations.
  html = html.replace(/<section([^>]*)\bclass=(['"])([^'"]*\bcontent-section\b[^'"]*)\2([^>]*)>\s*<\/section>/g, "");
  html = html.replace(/<div([^>]*)\bclass=(['"])([^'"]*\bcontent-section\b[^'"]*)\2([^>]*)>\s*<\/div>/g, "");

  return { html, changed };
}

function cleanGalleryCss(css) {
  if (!css) return css;

  css = css.replace(/#showcase :where\(\.media-row, \.media-system--row\) > :where\(\.media-group\[data-media-group="single"\], \.media-group--single\) \{[\s\S]*?\n\}/g, "");

  css = css.replace(/#showcase :where\(\.media-row, \.media-system--row\) > :where\(\.media-group\[data-media-group="single"\], \.media-group--single\) \.media-item > :where\(img, video\),\s*\n#showcase :where\(\.media-row, \.media-system--row\) > :where\(\.media-group\[data-media-group="single"\], \.media-group--single\) \.media-item > picture > img \{[\s\S]*?\n\}/g, "");

  css = css.replace(/#showcase :where\(\.media-row, \.media-system--row\) \{[\s\S]*?\n\}/g, "");

  css = css.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
  return css;
}

function ensureImport(css) {
  const line = '@import "./modules/portfolio-content-sections.css";';
  if (css.includes(line)) return css;
  const galleryLine = '@import "./modules/portfolio-gallery.css";';
  if (css.includes(galleryLine)) return css.replace(galleryLine, `${galleryLine}\n${line}`);
  return css.trimEnd() + `\n${line}\n`;
}

for (const target of targets) backup(target);

const indexPath = "index.html";
let html = read(indexPath);
if (!html) throw new Error("index.html not found");

const before = {
  img: count(/<img\b/g, html),
  video: count(/<video\b/g, html),
  canvas: count(/<canvas\b/g, html),
  hero: count(/<section\b[^>]*\bid=(['"])hero\1/g, html),
  resume: count(/<section\b[^>]*\bid=(['"])resume\1/g, html),
};

const oldRows = count(/\b(?:media-row|media-system--row)\b/g, html);
const result = normalizeSideRows(html);
html = result.html;

const after = {
  img: count(/<img\b/g, html),
  video: count(/<video\b/g, html),
  canvas: count(/<canvas\b/g, html),
  hero: count(/<section\b[^>]*\bid=(['"])hero\1/g, html),
  resume: count(/<section\b[^>]*\bid=(['"])resume\1/g, html),
};

for (const key of Object.keys(before)) {
  if (before[key] !== after[key]) {
    throw new Error(`${key} count changed: ${before[key]} -> ${after[key]}`);
  }
}

write(indexPath, html);

const galleryPath = "src/styles/modules/portfolio-gallery.css";
const galleryCss = read(galleryPath);
if (galleryCss) write(galleryPath, cleanGalleryCss(galleryCss));

const indexCssPath = "src/styles/index.css";
const indexCss = read(indexCssPath);
if (indexCss) write(indexCssPath, ensureImport(indexCss));

console.log(`side media rows before: ${oldRows}`);
console.log(`side media blocks normalized: ${result.changed}`);
console.log(`backup: ${backupRoot}`);
