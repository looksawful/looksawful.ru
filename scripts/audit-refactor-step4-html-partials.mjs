import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const exists = (name) => fs.existsSync(file(name));
const read = (name) => exists(name) ? fs.readFileSync(file(name), "utf8") : "";
const count = (text, re) => (text.match(re) || []).length;
const bytes = (text) => Buffer.byteLength(text || "");

const packageJson = JSON.parse(read("package.json") || "{}");
const scripts = packageJson.scripts || {};
const html = read("index.html");
const indexCss = read("src/styles/index.css");
const round5Css = read("src/styles/modules/refactor-round5-final.css");
const playlistEntry = read("src/visuals/dom/playlist-filter-embed.js");
const playlistCssEntry = read("src/styles/playlist-filter-embed.css");
const mounts = read("src/runtime/mounts.js");
const initRuntime = read("src/runtime/init-runtime.js");
const mountEngine = read("src/runtime/mount-engine.js");
const step4Check = read("_awful-html-partials-check.md");
const snapshot = read("src/html/pages/index.snapshot.html");
const manifest = read("src/html/partials.manifest.json");
const policy = read("src/html/partials/policy/policy-book.html");
const pets = read("src/html/partials/pets/pets-preview-section.html");
const petDir = file("src/html/partials/pets");
const petFiles = fs.existsSync(petDir)
  ? fs.readdirSync(petDir).filter((name) => name.endsWith(".html") && name !== "pets-preview-section.html")
  : [];

const checks = [
  ["step4 audit points to html partials", scripts["audit:refactor"] === "node scripts/audit-refactor-step4-html-partials.mjs"],
  ["step3 audit preserved", exists("scripts/audit-refactor-step3-playlist.mjs") && scripts["audit:refactor:step3"] === "node scripts/audit-refactor-step3-playlist.mjs"],
  ["build html script exists", exists("scripts/build-html.mjs")],
  ["build html package script exists", scripts["build:html"] === "node scripts/build-html.mjs --check"],
  ["html source readme exists", exists("src/html/README.md")],
  ["index snapshot exists", snapshot.length > 1000],
  ["index snapshot matches current live index", snapshot === html],
  ["partials manifest exists", manifest.includes("policyBook") && manifest.includes("petPreviews")],
  ["policy book partial exists", policy.includes("data-policy-book") || policy.includes("policy-book")],
  ["pets section partial exists", /id=[\"']pets[\"']/.test(pets) || pets.includes("data-pets-preview-list")],
  ["pet preview partials exist", petFiles.length >= 3],
  ["pet preview partials contain data-pet-preview", petFiles.every((name) => read(`src/html/partials/pets/${name}`).includes("data-pet-preview"))],
  ["html partial check exists", step4Check.includes("html partial pipeline check")],
  ["html partial check passed", !step4Check.includes("fail:")],
  ["playlist step3 js adapter preserved", playlistEntry.includes("playlist-filter/index.js") && playlistEntry.length < 1000],
  ["playlist step3 css adapter preserved", playlistCssEntry.includes("playlist-filter/index.css") && playlistCssEntry.length < 500],
  ["runtime step2 preserved", exists("src/runtime/schedule.js") && exists("src/runtime/visibility.js") && exists("src/runtime/visual-lifecycle.js")],
  ["runtime registry still present", /MOUNTS/.test(mounts) && /mountAll/.test(initRuntime) && /mountAll/.test(mountEngine)],
  ["round5 css still imported", indexCss.includes("refactor-round5-final.css")],
  ["playlist scope still present", round5Css.includes("--pf-surface")],
  ["policy scope still present", round5Css.includes("--policy-surface")],
  ["pet iframe still absent from main", count(html, /<iframe[\s\S]*?src=[\"']\/pets\//g) === 0],
  ["media layout attrs still present", count(html, /data-media-layout=/g) >= 16],
  ["media ratio attrs still present", count(html, /data-media-ratio=/g) >= 16],
];

let failed = false;
let out = "# remaining refactor step 4 html partials audit\n\n## checks\n";
for (const [name, ok] of checks) {
  out += `- ${ok ? "ok" : "fail"}: ${name}\n`;
  if (!ok) failed = true;
}
out += "\n## metrics\n";
out += `- indexHtmlBytes: ${bytes(html)}\n`;
out += `- snapshotBytes: ${bytes(snapshot)}\n`;
out += `- policyPartialBytes: ${bytes(policy)}\n`;
out += `- petsSectionBytes: ${bytes(pets)}\n`;
out += `- petPreviewPartialFiles: ${petFiles.length}\n`;
out += `- manifestBytes: ${bytes(manifest)}\n`;
out += `- mediaGroups: ${count(html, /class=[\"'][^\"']*media-group/g)}\n`;
out += `- mediaLayoutAttrs: ${count(html, /data-media-layout=/g)}\n`;
out += `- mediaRatioAttrs: ${count(html, /data-media-ratio=/g)}\n`;
out += `- legacyMobileRails: ${count(html, /media-group--mobile-rail/g)}\n`;
out += "\n## next step\n";
out += "- step 5 must remove legacy aliases/archive folders only after visual QA and add final browser regression checks.\n";

fs.writeFileSync(file("_awful-refactor-step4-html-partials-audit.md"), out, "utf8");
console.log(out);
if (failed) process.exit(1);
