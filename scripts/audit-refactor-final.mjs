import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const exists = (name) => fs.existsSync(file(name));
const read = (name) => exists(name) ? fs.readFileSync(file(name), "utf8") : "";
const count = (text, re) => (text.match(re) || []).length;

const html = read("index.html");
const pkg = read("package.json");
const indexCss = read("src/styles/index.css");
const round1Css = read("src/styles/modules/refactor-round1.css");
const round2Css = read("src/styles/modules/pet-preview-round2.css");
const round3Css = read("src/styles/modules/refactor-round3-typography.css");
const round4Css = read("src/styles/modules/refactor-round4-media.css");
const round5Css = read("src/styles/modules/refactor-round5-final.css");
const main = read("src/main.js");
const mounts = read("src/runtime/mounts.js");
const initRuntime = read("src/runtime/init-runtime.js");
const mountEngine = read("src/runtime/mount-engine.js");
const componentsIndex = read("src/components/index.js");
const mediaSlider = read("src/visuals/dom/media-slider.js");
const fitHeadings = read("src/components/fit-showcase-headings.js");
const visualRegistry = read("src/components/showcase-visuals/showcase-visual-registry.js");
const playlistFilter = read("src/visuals/dom/playlist-filter-embed.js");
const policyBook = read("src/visuals/dom/policy-book.js");

const mediaGroups = count(html, /class="[^"]*media-group/g);
const mediaLayoutAttrs = count(html, /data-media-layout=/g);
const mediaRatioAttrs = count(html, /data-media-ratio=/g);
const refactorCss = [round1Css, round2Css, round3Css, round4Css, round5Css].join("\n");

const runtimeOk =
  exists("src/runtime/mounts.js") &&
  exists("src/runtime/init-runtime.js") &&
  exists("src/runtime/mount-engine.js") &&
  mounts.includes("MOUNTS") &&
  main.includes("initRuntime") &&
  initRuntime.includes("mountAll") &&
  mountEngine.includes("mountAll");

const checks = [
  ["final css exists", exists("src/styles/modules/refactor-round5-final.css")],
  ["final css imported", indexCss.includes("refactor-round5-final.css")],
  ["audit points to final", pkg.includes("audit-refactor-final.mjs")],
  ["round1 runtime still present", runtimeOk],
  ["round1 before-after duplicate removed", !componentsIndex.includes("initShowcaseBeforeAfter")],
  ["round1 media slider auto-init removed", mediaSlider.length === 0 || !/DOMContentLoaded\s*[,)]/.test(mediaSlider)],
  ["round2 pet iframes removed", count(html, /<iframe[^>]+\/pets\//g) === 0],
  ["round2 pet previews present", count(html, /class="[^"]*pet-preview/g) >= 3 && exists("src/visuals/dom/pet-previews.js")],
  ["round3 typography present", round3Css.includes("--type-role-project") && round3Css.includes("--type-role-chapter")],
  ["round3 fit headings narrowed", fitHeadings.includes("round3FitAllowed")],
  ["round4 media attrs present", mediaGroups > 0 && mediaLayoutAttrs >= mediaGroups && mediaRatioAttrs >= mediaGroups],
  ["round4 visual registry present", visualRegistry.length > 200],
  ["round5 playlist scope present", round5Css.includes("--pf-surface") && round5Css.includes("playlist-filter-embed")],
  ["round5 policy scope present", round5Css.includes("--policy-surface") && round5Css.includes("policy-book")],
  ["playlist filter preserved", playlistFilter.length > 1000 || html.includes("playlist-filter")],
  ["policy book preserved", policyBook.length > 200 || html.includes("policy-book")],
  ["new refactor css has no important", !/!important/.test(refactorCss)],
];

const metrics = {
  mediaGroups,
  mediaLayoutAttrs,
  mediaRatioAttrs,
  mobileRailAttrs: count(html, /data-media-mobile="rail"/g),
  legacyMobileRails: count(html, /media-group--mobile-rail/g),
  petIframes: count(html, /<iframe[^>]+\/pets\//g),
  petPreviewArticles: count(html, /class="[^"]*pet-preview/g),
  titleXlRefs: count(html, /title--xl/g),
  titleLgRefs: count(html, /title--lg/g),
  runtimeMountRefs: count(mounts, /id\s*:/g),
  visualRegistryBytes: Buffer.byteLength(visualRegistry),
  playlistFilterBytes: Buffer.byteLength(playlistFilter),
  round5CssBytes: Buffer.byteLength(round5Css),
};

let out = "# refactor final audit\n\n## checks\n";
let failed = false;
for (const [name, ok] of checks) {
  out += `- ${ok ? "ok" : "fail"}: ${name}\n`;
  if (!ok) failed = true;
}
out += "\n## metrics\n";
for (const [key, value] of Object.entries(metrics)) out += `- ${key}: ${value}\n`;
out += "\n## manual visual qa\n";
out += "- mobile header: chips hidden, face trigger visible.\n";
out += "- pet previews: no iframe cards on the main page.\n";
out += "- typography: project/chapter headings large, inner headings quieter.\n";
out += "- media: Jestei/Styx/Shootings galleries keep layout and compact mobile rails.\n";
out += "- canvas/3d: before-after, diagonal/horizontal scenes, logo inspector.\n";
out += "- playlist filter and policy book remain visually unchanged except scoped guards.\n";
out += "\n## remaining deferred cleanup\n";
out += "- delete legacy media aliases only after visual QA.\n";
out += "- split playlist-filter-embed.js into real modules only with a source-level test pass.\n";
out += "- extract policy book markup from index.html only after confirming content parity.\n";

fs.writeFileSync(file("_awful-refactor-final-audit.md"), out);
console.log(out);
if (failed) process.exit(1);