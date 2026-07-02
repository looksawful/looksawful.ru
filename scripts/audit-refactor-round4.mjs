import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const exists = (name) => fs.existsSync(file(name));
const read = (name) => exists(name) ? fs.readFileSync(file(name), "utf8") : "";
const count = (text, re) => (text.match(re) || []).length;

const html = read("index.html");
const indexCss = read("src/styles/index.css");
const round4Css = read("src/styles/modules/refactor-round4-media.css");
const visualRegistry = read("src/components/showcase-visuals/showcase-visual-registry.js");
const componentsIndex = read("src/components/index.js");
const main = read("src/main.js");
const mounts = read("src/runtime/mounts.js");
const initRuntime = read("src/runtime/init-runtime.js");
const mountEngine = read("src/runtime/mount-engine.js");

const mediaGroups = count(html, /class="[^"]*media-group/g);
const mediaLayoutAttrs = count(html, /data-media-layout=/g);
const mediaRatioAttrs = count(html, /data-media-ratio=/g);

const visualRegistryPresent =
  exists("src/components/showcase-visuals/showcase-visual-registry.js") &&
  visualRegistry.length > 200 &&
  (visualRegistry.includes("before-after") || visualRegistry.includes("beforeAfter") || visualRegistry.includes("VISUAL"));

const runtimeRegistryPresent =
  exists("src/runtime/mounts.js") &&
  exists("src/runtime/init-runtime.js") &&
  exists("src/runtime/mount-engine.js") &&
  mounts.includes("MOUNTS") &&
  main.includes("initRuntime") &&
  initRuntime.includes("mountAll") &&
  mountEngine.includes("mountAll");

const checks = [
  ["round4 css exists", exists("src/styles/modules/refactor-round4-media.css")],
  ["round4 css imported", indexCss.includes("refactor-round4-media.css")],
  ["media layout attrs added", mediaGroups > 0 && mediaLayoutAttrs >= mediaGroups],
  ["media ratio attrs added", mediaGroups > 0 && mediaRatioAttrs >= mediaGroups],
  ["compact mobile rail css", round4Css.includes('data-media-mobile="rail"') && round4Css.includes('data-media-size="compact"')],
  ["visual registry still present", visualRegistryPresent],
  ["before-after direct duplicate remains removed", !componentsIndex.includes("initShowcaseBeforeAfter")],
  ["runtime registry still present", runtimeRegistryPresent],
];

const metrics = {
  mediaGroups,
  mediaLayoutAttrs,
  mediaRatioAttrs,
  mobileRailAttrs: count(html, /data-media-mobile="rail"/g),
  legacyMobileRails: count(html, /media-group--mobile-rail/g),
  visualSceneRefs: count(html, /data-animation=|data-visual-demo=/g),
  round4CssBytes: Buffer.byteLength(round4Css),
  runtimeMountRefs: count(mounts, /id\s*:/g),
  visualRegistryBytes: Buffer.byteLength(visualRegistry),
};

let out = "# refactor round 4 media/canvas audit\n\n## checks\n";
let failed = false;
for (const [name, ok] of checks) {
  out += `- ${ok ? "ok" : "fail"}: ${name}\n`;
  if (!ok) failed = true;
}
out += "\n## metrics\n";
for (const [key, value] of Object.entries(metrics)) out += `- ${key}: ${value}\n`;
out += "\n## next high-risk areas\n";
out += "- legacy media classes are still kept as aliases and can be deleted only after visual QA.\n";
out += "- canvas models are preserved; deeper shared-runtime migration is deferred to avoid breaking visuals.\n";
out += "- playlist filter is still a monolith and should be split in round 5.\n";
out += "- policy book still needs partial/document extraction in round 5.\n";

fs.writeFileSync(file("_awful-refactor-round4-audit.md"), out);
console.log(out);
if (failed) process.exit(1);