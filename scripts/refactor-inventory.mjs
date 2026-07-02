import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const rel = (file) => path.relative(root, file).replaceAll(path.sep, "/");
const file = (name) => path.join(root, name);
const exists = (name) => fs.existsSync(file(name));
const read = (name) => exists(name) ? fs.readFileSync(file(name), "utf8") : "";
const safeExec = (cmd) => {
  try { return execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return ""; }
};

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "out", ".next", ".nuxt", ".svelte-kit", "coverage", ".vite", ".vercel", ".wrangler", ".turbo"]);
const SOURCE_EXT = new Set([".html", ".css", ".js", ".mjs", ".ts", ".json", ".md"]);

function walk(dir, options = {}) {
  const out = [];
  const includeArchive = options.includeArchive ?? true;
  const visit = (current) => {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      const relative = rel(abs);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        if (!includeArchive && (relative.startsWith("_local/") || relative.startsWith("src/_lab/") || relative.startsWith("to-implement/"))) continue;
        visit(abs);
        continue;
      }
      if (entry.isFile() && SOURCE_EXT.has(path.extname(entry.name))) out.push(abs);
    }
  };
  visit(dir);
  return out.sort((a,b) => rel(a).localeCompare(rel(b)));
}

function listFilesUnder(relativeDir, extensions = null) {
  const abs = file(relativeDir);
  if (!fs.existsSync(abs)) return [];
  return walk(abs, { includeArchive: true })
    .filter((entry) => !extensions || extensions.has(path.extname(entry)))
    .map(rel);
}

function count(text, re) { return (text.match(re) || []).length; }
function bytes(name) { return exists(name) ? Buffer.byteLength(read(name)) : 0; }
function lines(name) { return exists(name) ? read(name).split(/\r?\n/).length : 0; }

const now = new Date().toISOString();
const branch = safeExec("git branch --show-current") || "unknown";
const head = safeExec("git log -1 --oneline") || "unknown";
const status = safeExec("git status --short") || "clean";
const pkg = JSON.parse(read("package.json") || "{}");
const indexHtml = read("index.html");
const indexCss = read("src/styles/index.css");
const mainJs = read("src/main.js");
const componentsIndex = read("src/components/index.js");
const mounts = read("src/runtime/mounts.js");
const visualRegistry = read("src/components/showcase-visuals/showcase-visual-registry.js");

const allSource = walk(root, { includeArchive: true }).map(rel);
const activeSource = walk(root, { includeArchive: false }).map(rel);
const jsFiles = activeSource.filter((name) => /\.(mjs|js|ts)$/.test(name));
const cssFiles = activeSource.filter((name) => name.endsWith(".css"));
const htmlFiles = activeSource.filter((name) => name.endsWith(".html"));
const mdFiles = activeSource.filter((name) => name.endsWith(".md"));
const importCss = [...indexCss.matchAll(/@import\s+["']([^"']+)["'];/g)].map((m) => m[1]);
const sectionIds = [...indexHtml.matchAll(/<section\b[^>]*\bid=["']([^"']+)["']/g)].map((m) => m[1]);
const articleIds = [...indexHtml.matchAll(/<article\b[^>]*\bid=["']([^"']+)["']/g)].map((m) => m[1]);
const dataAttrs = [...indexHtml.matchAll(/\s(data-[a-z0-9_-]+)(?:=|\s|>)/gi)].map((m) => m[1]);
const dataAttrCounts = Object.entries(dataAttrs.reduce((acc, attr) => { acc[attr] = (acc[attr] || 0) + 1; return acc; }, {})).sort((a,b) => b[1] - a[1]);
const classAttrs = [...indexHtml.matchAll(/class=["']([^"']+)["']/g)].flatMap((m) => m[1].split(/\s+/).filter(Boolean));
const classCounts = Object.entries(classAttrs.reduce((acc, cls) => { acc[cls] = (acc[cls] || 0) + 1; return acc; }, {})).sort((a,b) => b[1] - a[1]);

const runtimeFiles = [
  "src/runtime/dom.js",
  "src/runtime/init-runtime.js",
  "src/runtime/mount-engine.js",
  "src/runtime/mounts.js",
  "src/runtime/schedule.js",
  "src/runtime/visibility.js",
];
const visualFiles = [
  ...listFilesUnder("src/components/showcase-visuals", new Set([".js", ".mjs", ".ts"])),
  ...listFilesUnder("src/visuals/canvas", new Set([".js", ".mjs", ".ts"])),
  ...listFilesUnder("src/visuals/dom", new Set([".js", ".mjs", ".ts"])),
].filter((v, i, arr) => arr.indexOf(v) === i).sort();
const componentFiles = listFilesUnder("src/components", new Set([".js", ".mjs", ".ts"]));
const cssModuleFiles = listFilesUnder("src/styles/modules", new Set([".css"]));
const petPages = listFilesUnder("src/pets", new Set([".html", ".js", ".css"]));
const legacyDirs = ["_local", "to-implement", "src/_lab/inactive-visuals", "src/_lab/retired-runtime"];

const jsImportCounts = jsFiles.map((name) => [name, count(read(name), /\bimport\s*(?:\(|[\s{*A-Za-z])/g)]).filter(([, n]) => n > 0).sort((a,b) => b[1] - a[1]);
const heavyFiles = activeSource.map((name) => [name, bytes(name)]).filter(([, n]) => n > 50000).sort((a,b) => b[1] - a[1]);
const todoFiles = activeSource.map((name) => [name, count(read(name), /TODO|FIXME|@todo|HACK/gi)]).filter(([, n]) => n > 0).sort((a,b) => b[1] - a[1]);

const deferred = [
  ["round5 commit", /refactor final audit and scoped guards/.test(safeExec("git log --oneline -5"))],
  ["runtime schedule helper", exists("src/runtime/schedule.js")],
  ["runtime visibility helper", exists("src/runtime/visibility.js")],
  ["playlist filter split", exists("src/visuals/dom/playlist-filter/state.js") || exists("src/visuals/dom/playlist-filter/index.js")],
  ["playlist filter css split", exists("src/styles/modules/playlist-filter/base.css") || exists("src/styles/modules/playlist-filter/index.css")],
  ["html partial build pipeline", exists("scripts/build-html.mjs") && exists("src/html")],
  ["policy book partial", exists("src/html/partials/policy-book.html") || exists("src/html/policy-book.html")],
  ["pet preview partials", exists("src/html/pets/berserk-timer/preview.html") || exists("src/html/pets/awful-cases/preview.html")],
  ["legacy media aliases removed", count(indexHtml, /media-group--mobile-rail|media-group--square|media-group--grid|media-group--quad/g) === 0],
  ["archive cleanup", legacyDirs.every((dir) => !exists(dir))],
];

function table(rows, headers = ["item", "value"]) {
  const body = rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\|/g, "\\|")).join(" | ")} |`).join("\n");
  return `| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n${body || `| — | — |`}`;
}

let out = "# looksawful remaining refactor — component inventory and baseline\n\n";
out += `generated: ${now}\n\n`;
out += "## git baseline\n\n";
out += table([["branch", branch], ["head", head], ["status", status.includes("\n") ? status.replace(/\n/g, "<br>") : status]]);
out += "\n\n## package scripts\n\n";
out += table(Object.entries(pkg.scripts || {}).sort(), ["script", "command"]);
out += "\n\n## source counts\n\n";
out += table([
  ["all source files with archive/lab", allSource.length],
  ["active source files without _local/to-implement/src/_lab", activeSource.length],
  ["active js/mjs/ts", jsFiles.length],
  ["active css", cssFiles.length],
  ["active html", htmlFiles.length],
  ["active md", mdFiles.length],
  ["index.html bytes", bytes("index.html")],
  ["playlist-filter-embed.js bytes", bytes("src/visuals/dom/playlist-filter-embed.js")],
  ["playlist-filter-embed.css bytes", bytes("src/styles/playlist-filter-embed.css")],
]);
out += "\n\n## runtime map\n\n";
out += table(runtimeFiles.map((name) => [name, exists(name) ? "present" : "missing", lines(name)]), ["file", "status", "lines"]);
out += "\n\n## mount registry signals\n\n";
out += table([
  ["main imports initRuntime", /initRuntime/.test(mainJs)],
  ["mounts has MOUNTS", /MOUNTS/.test(mounts)],
  ["mount refs in mounts.js", count(mounts, /id\s*:/g)],
  ["components/index.js remains bridge", componentsIndex.length > 0],
  ["visual registry bytes", Buffer.byteLength(visualRegistry)],
]);
out += "\n\n## component modules\n\n";
out += table(componentFiles.map((name) => [name, lines(name), bytes(name)]).slice(0, 120), ["file", "lines", "bytes"]);
out += "\n\n## visual/dom/canvas modules\n\n";
out += table(visualFiles.map((name) => [name, lines(name), bytes(name)]).slice(0, 160), ["file", "lines", "bytes"]);
out += "\n\n## css modules imported by index.css\n\n";
out += table(importCss.map((name) => [name]), ["import"]);
out += "\n\n## css module files\n\n";
out += table(cssModuleFiles.map((name) => [name, lines(name), bytes(name)]).slice(0, 160), ["file", "lines", "bytes"]);
out += "\n\n## html section/article map\n\n";
out += table([
  ...sectionIds.map((id) => ["section", id]),
  ...articleIds.map((id) => ["article", id]),
], ["tag", "id"]);
out += "\n\n## top data attributes\n\n";
out += table(dataAttrCounts.slice(0, 80), ["data attribute", "count"]);
out += "\n\n## top classes\n\n";
out += table(classCounts.slice(0, 120), ["class", "count"]);
out += "\n\n## media and pet state\n\n";
out += table([
  ["media groups", count(indexHtml, /class=["'][^"']*media-group/g)],
  ["data-media-layout", count(indexHtml, /data-media-layout=/g)],
  ["data-media-ratio", count(indexHtml, /data-media-ratio=/g)],
  ["data-media-mobile=rail", count(indexHtml, /data-media-mobile=["']rail["']/g)],
  ["legacy media mobile rails", count(indexHtml, /media-group--mobile-rail/g)],
  ["main page iframe refs", count(indexHtml, /<iframe\b/gi)],
  ["pet preview articles", count(indexHtml, /pet-preview__article|data-pet-preview/g)],
], ["metric", "value"]);
out += "\n\n## pet source files\n\n";
out += table(petPages.map((name) => [name, lines(name), bytes(name)]).slice(0, 80), ["file", "lines", "bytes"]);
out += "\n\n## heavy active files over 50kb\n\n";
out += table(heavyFiles.map(([name, n]) => [name, n]), ["file", "bytes"]);
out += "\n\n## js import density\n\n";
out += table(jsImportCounts.slice(0, 80), ["file", "import refs"]);
out += "\n\n## archive/lab/legacy folders\n\n";
out += table(legacyDirs.map((dir) => [dir, exists(dir) ? "present" : "absent", exists(dir) ? walk(file(dir), { includeArchive: true }).length : 0]), ["path", "status", "source files"]);
out += "\n\n## todo/fixme/hack markers\n\n";
out += table(todoFiles.slice(0, 80), ["file", "markers"]);
out += "\n\n## deferred cleanup map\n\n";
out += table(deferred.map(([name, done]) => [done ? "done" : "open", name]), ["status", "task"]);
out += "\n\n## required next batches\n\n";
out += "1. runtime completion: add schedule/visibility helpers and reduce components/index.js to bridge or registry entry.\n";
out += "2. canvas lifecycle: remove local pending/active/cache duplication where shared runtime can own lifecycle.\n";
out += "3. playlist filter source split: state/data/icons/render/interactions/css modules without visual change.\n";
out += "4. html partials: build-html pipeline, policy book partial, pet preview partials.\n";
out += "5. legacy cleanup: media aliases, typography aliases, _local/to-implement/src/_lab/archive cleanup, final browser QA.\n";

fs.mkdirSync(file("docs/refactor"), { recursive: true });
fs.writeFileSync(file("_awful-refactor-inventory.md"), out);
fs.writeFileSync(file("docs/refactor/component-inventory.md"), out);
console.log(out);
