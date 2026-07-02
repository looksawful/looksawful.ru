import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const read = (name) => fs.existsSync(file(name)) ? fs.readFileSync(file(name), "utf8") : "";
const write = (name, value) => {
  fs.mkdirSync(path.dirname(file(name)), { recursive: true });
  fs.writeFileSync(file(name), value, "utf8");
};
const exists = (name) => fs.existsSync(file(name));

function rewriteRelativeJsImports(text) {
  return text
    .replace(/(from\s*["'])\.\//g, "$1../")
    .replace(/(import\s*["'])\.\//g, "$1../");
}

function rewriteRelativeCssUrls(text) {
  return text.replace(/url\((['"]?)(?!\/|data:|https?:|#)([^)'"\s][^)]*?)\1\)/g, (match, quote, url) => {
    if (url.startsWith("../")) return match;
    return `url(${quote}../${url}${quote})`;
  });
}

function ensurePackageScripts() {
  const pkgPath = file("package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts["audit:refactor:step2"]) {
    pkg.scripts["audit:refactor:step2"] = "node scripts/audit-refactor-step2-runtime.mjs";
  }
  if (!pkg.scripts["audit:refactor:step1"]) {
    pkg.scripts["audit:refactor:step1"] = "node scripts/audit-refactor-step1-inventory.mjs";
  }
  if (!pkg.scripts["audit:refactor:final"]) {
    pkg.scripts["audit:refactor:final"] = "node scripts/audit-refactor-final.mjs";
  }
  pkg.scripts["audit:refactor"] = "node scripts/audit-refactor-step3-playlist.mjs";
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

function splitPlaylistJs() {
  const legacyPath = "src/visuals/dom/playlist-filter/legacy-app.js";
  const entryPath = "src/visuals/dom/playlist-filter-embed.js";
  const currentEntry = read(entryPath);
  const existingLegacy = read(legacyPath);
  const source = existingLegacy.length > 5000 ? existingLegacy : currentEntry;

  if (source.length < 5000 || !source.includes("initPlaylistFilterEmbed")) {
    throw new Error("cannot locate original playlist filter source for legacy module");
  }

  const legacySource = existingLegacy.length > 5000 ? existingLegacy : rewriteRelativeJsImports(source);
  write(legacyPath, legacySource);

  write(entryPath, [
    "// adapter kept for existing imports; implementation lives in ./playlist-filter/legacy-app.js",
    "export { initPlaylistFilterEmbed } from \"./playlist-filter/index.js\";",
    "",
  ].join("\n"));
}

function splitPlaylistCss() {
  const entryPath = "src/styles/playlist-filter-embed.css";
  const legacyPath = "src/styles/playlist-filter/legacy.css";
  const currentEntry = read(entryPath);
  const existingLegacy = read(legacyPath);
  const source = existingLegacy.length > 5000 ? existingLegacy : currentEntry;

  if (source.length < 5000 || !source.includes("playlist-filter-embed")) {
    throw new Error("cannot locate original playlist filter css for legacy module");
  }

  const legacyCss = existingLegacy.length > 5000 ? existingLegacy : rewriteRelativeCssUrls(source);
  write(legacyPath, legacyCss);

  write(entryPath, [
    "@import \"./playlist-filter/index.css\";",
    "",
  ].join("\n"));
}

ensurePackageScripts();
splitPlaylistJs();
splitPlaylistCss();

console.log("[remaining-step3] patched playlist filter js/css split and package scripts");
