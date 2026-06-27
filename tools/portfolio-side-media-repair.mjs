import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/T/, "-").replace(/\..+/, "");
const backupRoot = path.join(root, "tools", "portfolio-side-media-repair-backups", stamp);

const files = [
  "index.html",
  "src/styles/index.css",
  "src/styles/modules/portfolio-gallery.css",
  "src/styles/modules/portfolio-content-sections.css",
];

function read(rel) {
  return fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), "utf8") : "";
}

function write(rel, value) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function backup(rel) {
  const src = path.join(root, rel);
  if (!fs.existsSync(src)) return;
  const dst = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

for (const rel of files) backup(rel);

const galleryCss = fs.readFileSync(path.join(root, "src", "styles", "modules", "portfolio-gallery.css"), "utf8");
const contentCss = fs.readFileSync(path.join(root, "src", "styles", "modules", "portfolio-content-sections.css"), "utf8");

function assertBalancedCss(name, css) {
  let n = 0;
  for (const ch of css) {
    if (ch === "{") n += 1;
    if (ch === "}") n -= 1;
    if (n < 0) throw new Error(`${name}: extra closing brace`);
  }
  if (n !== 0) throw new Error(`${name}: unclosed block count ${n}`);
}

assertBalancedCss("portfolio-gallery.css", galleryCss);
assertBalancedCss("portfolio-content-sections.css", contentCss);

let html = read("index.html");
const beforeRows = (html.match(/\b(?:media-row|media-system--row)\b/g) || []).length;

function normalizeClassValue(value) {
  const tokens = value.split(/\s+/).filter(Boolean);
  const keep = tokens.filter((token) => {
    if (token === "media-row" || token === "media-system") return false;
    if (token.startsWith("media-row--")) return false;
    if (token === "media-system--row") return false;
    return true;
  });
  if (!keep.includes("content-section")) keep.unshift("content-section");
  if (!keep.includes("content-section--text-media")) keep.push("content-section--text-media");
  return [...new Set(keep)].join(" ");
}

html = html.replace(/class="([^"]*(?:\bmedia-row\b|\bmedia-system--row\b)[^"]*)"/g, (_match, cls) => {
  return `class="${normalizeClassValue(cls)}"`;
});

html = html.replace(/\sdata-media-gallery="row"/g, "");
html = html.replace(/\s{2,}>/g, ">");

const afterRows = (html.match(/\b(?:media-row|media-system--row)\b/g) || []).length;
write("index.html", html);

let indexCss = read("src/styles/index.css");
function ensureImport(css, importLine, afterNeedle) {
  if (css.includes(importLine)) return css;
  const lines = css.split(/\r?\n/);
  const idx = lines.findIndex((line) => line.includes(afterNeedle));
  if (idx >= 0) {
    lines.splice(idx + 1, 0, importLine);
    return lines.join("\n");
  }
  return `${css.replace(/\s+$/, "")}\n${importLine}\n`;
}
indexCss = ensureImport(indexCss, '@import "./modules/portfolio-gallery.css";', "portfolio-system.css");
indexCss = ensureImport(indexCss, '@import "./modules/portfolio-content-sections.css";', "portfolio-gallery.css");
write("src/styles/index.css", indexCss);

console.log(`side-media class refs before: ${beforeRows}`);
console.log(`side-media class refs after: ${afterRows}`);
console.log(`backup: ${backupRoot}`);
console.log("portfolio-gallery.css repaired and balanced");
