import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const exists = (name) => fs.existsSync(file(name));
const read = (name) => exists(name) ? fs.readFileSync(file(name), "utf8") : "";
const count = (text, re) => (text.match(re) || []).length;
const pkg = JSON.parse(read("package.json") || "{}");
const html = read("index.html");
const indexCss = read("src/styles/index.css");
const inventory = read("_awful-refactor-inventory.md");
const inventoryDoc = read("docs/refactor/component-inventory.md");
const finalAudit = read("_awful-refactor-final-audit.md");
const round5Css = read("src/styles/modules/refactor-round5-final.css");
const mounts = read("src/runtime/mounts.js");
const visualRegistry = read("src/components/showcase-visuals/showcase-visual-registry.js");

const scripts = pkg.scripts || {};
const checks = [
  ["inventory script exists", exists("scripts/refactor-inventory.mjs")],
  ["inventory root md exists", exists("_awful-refactor-inventory.md")],
  ["inventory docs md exists", exists("docs/refactor/component-inventory.md")],
  ["inventory package script exists", scripts["inventory:refactor"] === "node scripts/refactor-inventory.mjs"],
  ["audit points to step1 inventory", scripts["audit:refactor"] === "node scripts/audit-refactor-step1-inventory.mjs"],
  ["inventory has runtime map", inventory.includes("## runtime map") && inventoryDoc.includes("## runtime map")],
  ["inventory has component modules", inventory.includes("## component modules")],
  ["inventory has visual modules", inventory.includes("## visual/dom/canvas modules")],
  ["inventory has css modules", inventory.includes("## css module files")],
  ["inventory has html map", inventory.includes("## html section/article map")],
  ["inventory has deferred cleanup map", inventory.includes("## deferred cleanup map")],
  ["final baseline audit still exists", exists("_awful-refactor-final-audit.md") && finalAudit.includes("# refactor final audit")],
  ["round5 css still imported", indexCss.includes("refactor-round5-final.css")],
  ["round5 playlist scope still present", round5Css.includes(".playlist-filter-embed") && round5Css.includes("--pf-")],
  ["round5 policy scope still present", round5Css.includes(".policy-book") && round5Css.includes("--policy-")],
  ["runtime registry still present", exists("src/runtime/mounts.js") && /MOUNTS/.test(mounts)],
  ["visual registry still present", exists("src/components/showcase-visuals/showcase-visual-registry.js") && visualRegistry.length > 100],
  ["pet iframe still absent from main", count(html, /<iframe\b/gi) === 0],
  ["media layout attrs still present", count(html, /data-media-layout=/g) >= 1],
  ["media ratio attrs still present", count(html, /data-media-ratio=/g) >= 1],
];

const metrics = {
  inventoryBytes: Buffer.byteLength(inventory),
  inventoryDocBytes: Buffer.byteLength(inventoryDoc),
  mediaGroups: count(html, /class=["'][^"']*media-group/g),
  mediaLayoutAttrs: count(html, /data-media-layout=/g),
  mediaRatioAttrs: count(html, /data-media-ratio=/g),
  legacyMobileRails: count(html, /media-group--mobile-rail/g),
  runtimeMountRefs: count(mounts, /id\s*:/g),
  playlistFilterBytes: Buffer.byteLength(read("src/visuals/dom/playlist-filter-embed.js")),
  playlistFilterCssBytes: Buffer.byteLength(read("src/styles/playlist-filter-embed.css")),
};

let out = "# remaining refactor step 1 inventory audit\n\n## checks\n";
let failed = false;
for (const [name, ok] of checks) {
  out += `- ${ok ? "ok" : "fail"}: ${name}\n`;
  if (!ok) failed = true;
}
out += "\n## metrics\n";
for (const [key, value] of Object.entries(metrics)) out += `- ${key}: ${value}\n`;
out += "\n## next step\n";
out += "- step 2 must complete runtime helpers, registry boundaries and canvas lifecycle cleanup using this inventory as baseline.\n";

fs.writeFileSync(file("_awful-refactor-step1-inventory-audit.md"), out);
console.log(out);
if (failed) process.exit(1);
