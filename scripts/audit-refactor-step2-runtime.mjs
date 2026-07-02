import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const exists = (name) => fs.existsSync(file(name));
const read = (name) => exists(name) ? fs.readFileSync(file(name), "utf8") : "";
const count = (text, re) => (text.match(re) || []).length;

const packageJson = JSON.parse(read("package.json") || "{}");
const scripts = packageJson.scripts || {};

const files = {
  main: read("src/main.js"),
  schedule: read("src/runtime/schedule.js"),
  visibility: read("src/runtime/visibility.js"),
  visualLifecycle: read("src/runtime/visual-lifecycle.js"),
  initRuntime: read("src/runtime/init-runtime.js"),
  mountEngine: read("src/runtime/mount-engine.js"),
  mounts: read("src/runtime/mounts.js"),
  components: read("src/components/index.js"),
  visualRegistry: read("src/components/showcase-visuals/showcase-visual-registry.js"),
  html: read("index.html"),
  indexCss: read("src/styles/index.css"),
  round5Css: read("src/styles/modules/refactor-round5-final.css"),
  inventory: read("docs/refactor/component-inventory.md"),
  doc: read("docs/refactor/runtime-canvas-lifecycle.md"),
};

const mountEngineUsesSplitHelpers =
  files.mountEngine.includes('from "./schedule.js"') &&
  files.mountEngine.includes('from "./visibility.js"') &&
  files.mountEngine.includes('from "./dom.js"');

const runtimeRegistryPresent =
  exists("src/runtime/mounts.js") &&
  exists("src/runtime/init-runtime.js") &&
  exists("src/runtime/mount-engine.js") &&
  /MOUNTS/.test(files.mounts) &&
  /initRuntime/.test(files.main) &&
  /mountAll/.test(files.initRuntime) &&
  /mountAll/.test(files.mountEngine);

const checks = [
  ["step2 audit points to runtime", scripts["audit:refactor"] === "node scripts/audit-refactor-step2-runtime.mjs"],
  ["step1 audit preserved", exists("scripts/audit-refactor-step1-inventory.mjs") && scripts["audit:refactor:step1"] === "node scripts/audit-refactor-step1-inventory.mjs"],
  ["schedule helper exists", exists("src/runtime/schedule.js")],
  ["visibility helper exists", exists("src/runtime/visibility.js")],
  ["visual lifecycle helper exists", exists("src/runtime/visual-lifecycle.js")],
  ["schedule exports runWhenIdle", /export\s+function\s+runWhenIdle/.test(files.schedule)],
  ["schedule exports runAfterFirstPaint", /export\s+function\s+runAfterFirstPaint/.test(files.schedule)],
  ["visibility exports runWhenNear", /export\s+function\s+runWhenNear/.test(files.visibility)],
  ["visibility uses IntersectionObserver", files.visibility.includes("IntersectionObserver")],
  ["visual lifecycle exports create registry", /export\s+function\s+createVisualLifecycleRegistry/.test(files.visualLifecycle)],
  ["visual lifecycle exports mountOnce", /export\s+function\s+mountOnce/.test(files.visualLifecycle)],
  ["mount engine uses split helpers", mountEngineUsesSplitHelpers],
  ["mount engine has no PowerShell newline literals", !files.mountEngine.includes("`n") && !files.mountEngine.includes("`r")],
  ["runtime registry still present", runtimeRegistryPresent],
  ["components index remains bridge", files.components.includes("export function initComponents")],
  ["visual registry still present", files.visualRegistry.length > 100 && /before-after|showcase-diagonal|showcase-horizontal/.test(files.visualRegistry)],
  ["before-after direct duplicate remains removed", !files.components.includes("initShowcaseBeforeAfter")],
  ["inventory baseline preserved", files.inventory.includes("component inventory") && files.inventory.includes("runtime map")],
  ["runtime lifecycle doc exists", files.doc.includes("runtime boundaries") || files.doc.includes("visual lifecycle")],
  ["round5 css still imported", files.indexCss.includes("refactor-round5-final.css")],
  ["playlist scope still present", files.round5Css.includes("--pf-surface")],
  ["policy scope still present", files.round5Css.includes("--policy-surface")],
  ["pet iframe still absent from main", count(files.html, /<iframe[\s\S]*?src="\/pets\//g) === 0],
  ["media layout attrs still present", count(files.html, /data-media-layout=/g) >= 16],
  ["media ratio attrs still present", count(files.html, /data-media-ratio=/g) >= 16],
];

const canvasFiles = [
  "src/visuals/canvas/before-after/index.js",
  "src/visuals/canvas/landing-motion/arc/index.js",
  "src/visuals/canvas/landing-motion/masonry/index.js",
  "src/visuals/canvas/showcase-diagonal/index.js",
  "src/visuals/canvas/showcase-horizontal/index.js",
];

const canvasMetrics = Object.fromEntries(
  canvasFiles.map((name) => {
    const text = read(name);
    return [name, {
      bytes: Buffer.byteLength(text),
      activeRefs: count(text, /activeAnimations|pendingMounts|imageCache|requestAnimationFrame/g),
    }];
  }),
);

const metrics = {
  runtimeMountRefs: count(files.mounts, /id:\s*"/g),
  componentsIndexBytes: Buffer.byteLength(files.components),
  scheduleBytes: Buffer.byteLength(files.schedule),
  visibilityBytes: Buffer.byteLength(files.visibility),
  visualLifecycleBytes: Buffer.byteLength(files.visualLifecycle),
  visualRegistryBytes: Buffer.byteLength(files.visualRegistry),
  mediaGroups: count(files.html, /class="[^"]*media-group/g),
  mediaLayoutAttrs: count(files.html, /data-media-layout=/g),
  mediaRatioAttrs: count(files.html, /data-media-ratio=/g),
  legacyMobileRails: count(files.html, /media-group--mobile-rail/g),
  playlistFilterBytes: Buffer.byteLength(read("src/visuals/dom/playlist-filter-embed.js")),
};

let out = "# remaining refactor step 2 runtime/canvas audit\n\n## checks\n";
let failed = false;
for (const [name, ok] of checks) {
  out += `- ${ok ? "ok" : "fail"}: ${name}\n`;
  if (!ok) failed = true;
}

out += "\n## metrics\n";
for (const [key, value] of Object.entries(metrics)) out += `- ${key}: ${value}\n`;

out += "\n## canvas scene lifecycle scan\n";
for (const [name, value] of Object.entries(canvasMetrics)) {
  out += `- ${name}: ${value.bytes} bytes, ${value.activeRefs} lifecycle/state refs\n`;
}

out += "\n## next step\n";
out += "- step 3 must split playlist-filter-embed.js and playlist-filter-embed.css into source modules without visual changes.\n";

fs.writeFileSync(file("_awful-refactor-step2-runtime-audit.md"), out);
console.log(out);
if (failed) process.exit(1);
