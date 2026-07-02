import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const exists = (name) => fs.existsSync(file(name));
const read = (name) => exists(name) ? fs.readFileSync(file(name), "utf8") : "";
const count = (text, re) => (text.match(re) || []).length;

const pkg = JSON.parse(read("package.json") || "{}");
const scripts = pkg.scripts || {};
const files = {
  jsEntry: read("src/visuals/dom/playlist-filter-embed.js"),
  jsIndex: read("src/visuals/dom/playlist-filter/index.js"),
  jsLegacy: read("src/visuals/dom/playlist-filter/legacy-app.js"),
  cssEntry: read("src/styles/playlist-filter-embed.css"),
  cssIndex: read("src/styles/playlist-filter/index.css"),
  cssLegacy: read("src/styles/playlist-filter/legacy.css"),
  html: read("index.html"),
  indexCss: read("src/styles/index.css"),
  round5Css: read("src/styles/modules/refactor-round5-final.css"),
  mountEngine: read("src/runtime/mount-engine.js"),
  mounts: read("src/runtime/mounts.js"),
  main: read("src/main.js"),
  step2Doc: read("docs/refactor/runtime-canvas-lifecycle.md"),
  step3Doc: read("docs/refactor/playlist-filter-split.md"),
  state: read("src/visuals/dom/playlist-filter/state.js"),
  data: read("src/visuals/dom/playlist-filter/data.js"),
  icons: read("src/visuals/dom/playlist-filter/icons.js"),
  render: read("src/visuals/dom/playlist-filter/render.js"),
  interactions: read("src/visuals/dom/playlist-filter/interactions.js"),
  presentation: read("src/visuals/dom/playlist-filter/presentation.js"),
  cssTokens: read("src/styles/playlist-filter/tokens.css"),
  cssShell: read("src/styles/playlist-filter/shell.css"),
  cssControls: read("src/styles/playlist-filter/controls.css"),
  cssModal: read("src/styles/playlist-filter/modal.css"),
  cssResponsive: read("src/styles/playlist-filter/responsive.css"),
};

const runtimeRegistryPresent =
  exists("src/runtime/mounts.js") &&
  exists("src/runtime/init-runtime.js") &&
  exists("src/runtime/mount-engine.js") &&
  /MOUNTS/.test(files.mounts) &&
  /initRuntime/.test(files.main) &&
  /mountAll/.test(read("src/runtime/init-runtime.js")) &&
  /mountAll/.test(files.mountEngine);

const checks = [
  ["step3 audit points to playlist", scripts["audit:refactor"] === "node scripts/audit-refactor-step3-playlist.mjs"],
  ["step2 audit preserved", exists("scripts/audit-refactor-step2-runtime.mjs") && scripts["audit:refactor:step2"] === "node scripts/audit-refactor-step2-runtime.mjs"],
  ["playlist js entry is adapter", files.jsEntry.length < 500 && files.jsEntry.includes("./playlist-filter/index.js")],
  ["playlist js legacy module exists", files.jsLegacy.length > 100000 && files.jsLegacy.includes("initPlaylistFilterEmbed")],
  ["playlist js index exports init", files.jsIndex.includes("initPlaylistFilterEmbed") && files.jsIndex.includes("legacy-app.js")],
  ["playlist state boundary exists", files.state.includes("createPlaylistFilterState")],
  ["playlist data boundary exists", files.data.includes("getPlaylistFilterData")],
  ["playlist icons boundary exists", files.icons.includes("getPlaylistFilterIcons")],
  ["playlist render boundary exists", files.render.includes("renderPlaylistFilter")],
  ["playlist interactions boundary exists", files.interactions.includes("bindPlaylistFilterInteractions")],
  ["playlist presentation boundary exists", files.presentation.includes("applyPlaylistFilterPresentation")],
  ["playlist css entry is adapter", files.cssEntry.length < 160 && files.cssEntry.includes("./playlist-filter/index.css")],
  ["playlist css legacy module exists", files.cssLegacy.length > 50000 && files.cssLegacy.includes("playlist-filter-embed")],
  ["playlist css index imports legacy", files.cssIndex.includes("legacy.css")],
  ["playlist css boundaries exist", files.cssTokens.includes("playlist filter tokens") && files.cssShell.includes("playlist filter shell") && files.cssControls.includes("playlist filter controls") && files.cssResponsive.includes("playlist filter responsive")],
  ["playlist split doc exists", files.step3Doc.includes("playlist filter split") && files.step3Doc.includes("visual parity")],
  ["runtime step2 preserved", exists("src/runtime/schedule.js") && exists("src/runtime/visibility.js") && files.mountEngine.includes("./schedule.js")],
  ["runtime registry still present", runtimeRegistryPresent],
  ["round5 css still imported", files.indexCss.includes("refactor-round5-final.css")],
  ["playlist scope still present", files.round5Css.includes("--pf-surface")],
  ["policy scope still present", files.round5Css.includes("--policy-surface")],
  ["pet iframe still absent from main", count(files.html, /<iframe[\s\S]*?src="\/pets\//g) === 0],
  ["media layout attrs still present", count(files.html, /data-media-layout=/g) >= 16],
  ["media ratio attrs still present", count(files.html, /data-media-ratio=/g) >= 16],
];

const metrics = {
  jsEntryBytes: Buffer.byteLength(files.jsEntry),
  jsLegacyBytes: Buffer.byteLength(files.jsLegacy),
  cssEntryBytes: Buffer.byteLength(files.cssEntry),
  cssLegacyBytes: Buffer.byteLength(files.cssLegacy),
  playlistModuleFiles: ["index", "legacy-app", "state", "data", "icons", "render", "interactions", "presentation"].filter((name) => exists(`src/visuals/dom/playlist-filter/${name}.js`)).length,
  playlistCssModuleFiles: ["index", "legacy", "tokens", "shell", "controls", "modal", "responsive"].filter((name) => exists(`src/styles/playlist-filter/${name}.css`)).length,
  runtimeMountRefs: count(files.mounts, /id:\s*"/g),
  mediaGroups: count(files.html, /class="[^"]*media-group/g),
  mediaLayoutAttrs: count(files.html, /data-media-layout=/g),
  mediaRatioAttrs: count(files.html, /data-media-ratio=/g),
  legacyMobileRails: count(files.html, /media-group--mobile-rail/g),
};

let out = "# remaining refactor step 3 playlist split audit\n\n## checks\n";
let failed = false;
for (const [name, ok] of checks) {
  out += `- ${ok ? "ok" : "fail"}: ${name}\n`;
  if (!ok) failed = true;
}
out += "\n## metrics\n";
for (const [key, value] of Object.entries(metrics)) out += `- ${key}: ${value}\n`;
out += "\n## next step\n";
out += "- step 4 must add html partial build pipeline, policy book partial and pet preview source partials.\n";

fs.writeFileSync(file("_awful-refactor-step3-playlist-audit.md"), out);
console.log(out);
if (failed) process.exit(1);
