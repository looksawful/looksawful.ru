const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = process.cwd();

const css = {
  rootIndex: "src/styles/index.css",

  core: "src/styles/core.css",
  components: "src/styles/components.css",

  oldDesignSystem: "src/styles/design-system.css",
  oldReset: "src/styles/reset.css",
  oldTypography: "src/styles/typography.css",
  importantOverrides: "src/styles/important-overrides.css",

  oldChips: "src/styles/patterns/chips.css",
  oldTechList: "src/styles/patterns/tech-list.css",
  oldAwfulface: "src/styles/components/awfulface.css",
  oldFooter: "src/styles/components/site-footer.css",

  hero: "src/styles/sections/hero.css",
  cv: "src/styles/sections/cv.css",
  cvList: "src/styles/sections/cv-list.css",
  petProjects: "src/styles/sections/pet-projects.css",
  resume: "src/styles/sections/resume.css",

  showcase: "src/styles/sections/showcase.css",
  showcaseIndex: "src/styles/sections/showcase/index.css",
  showcaseDir: "src/styles/sections/showcase",

  taskLegacy: "src/styles/sections/showcase/task-legacy.css",
  galleriesLegacy: "src/styles/sections/showcase/galleries-legacy.css",
  guards: "src/styles/sections/showcase/guards.css",

  html: "index.html"
};

function abs(file) {
  return path.join(root, file);
}

function exists(file) {
  return fs.existsSync(abs(file));
}

function read(file) {
  if (!exists(file)) return "";
  return fs.readFileSync(abs(file), "utf8");
}

function write(file, text) {
  fs.mkdirSync(path.dirname(abs(file)), { recursive: true });
  fs.writeFileSync(abs(file), normalize(text), "utf8");
}

function writeRaw(file, text) {
  fs.mkdirSync(path.dirname(abs(file)), { recursive: true });
  fs.writeFileSync(abs(file), text, "utf8");
}

function remove(file) {
  if (exists(file)) {
    fs.unlinkSync(abs(file));
    console.log("removed: " + file);
  }
}

function normalize(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}

function stripCssImports(text) {
  return String(text).replace(/^\s*@import\s+[^;]+;\s*\n?/gm, "");
}

function collectCssImports(text) {
  const matches = String(text).match(/^\s*@import\s+[^;]+;\s*$/gm) || [];
  return matches.map(function (line) {
    return line.trim();
  });
}

function section(title, body) {
  const clean = normalize(body || "");
  if (!clean.trim()) return "";
  return [
    "/* " + title + ":start */",
    clean.trim(),
    "/* " + title + ":end */",
    ""
  ].join("\n");
}

function stripNoise(text) {
  return String(text)
    .replace(/^\s*\/\*\s*\*\/\s*\n?/gm, "")
    .replace(/^\s*\/\*\s*generated important override layer:(start|end)\s*\*\/\s*\n?/gm, "")
    .replace(/^\s*\/\*\s*This file preserves previous important-based cascade.*?\*\/\s*\n?/gm, "")
    .replace(/^\s*\/\*\s*showcase (task|galleries) current layer:(start|end)\s*\*\/\s*\n?/gm, "");
}

function extractBlockByMarker(text, marker) {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("\\n?/\\*\\s*" + escaped + ":start\\s*\\*/[\\s\\S]*?/\\*\\s*" + escaped + ":end\\s*\\*/\\n?", "m");
  const match = text.match(re);
  if (!match) return { block: "", rest: text };
  return { block: match[0], rest: text.replace(re, "\n") };
}

function extractRootBlock(text) {
  const match = text.match(/:root\s*\{[\s\S]*?\n\}/m);
  if (!match) return { block: "", rest: text };
  return { block: match[0], rest: text.replace(match[0], "\n") };
}

function extractMediaRoot48(text) {
  const match = text.match(/@media\s*\(max-width:\s*48rem\)\s*\{\s*:root\s*\{[\s\S]*?\n\s*\}\s*\}/m);
  if (!match) return { block: "", rest: text };
  return { block: match[0], rest: text.replace(match[0], "\n") };
}

function removeImportant(text) {
  return String(text).replace(/\s*!important\b/g, "");
}

function ensureHeroRoot() {
  if (!exists(css.hero)) return;
  const text = read(css.hero);
  if (/^\.hero\s*\{/m.test(text)) return;
  write(css.hero, ".hero {\n  min-inline-size: 0;\n}\n\n" + text);
}

function addStyxPhotoClassToHtml() {
  if (!exists(css.html)) return;
  let html = read(css.html);

  html = html.replace(
    /aria-label="styx photo production image" class="cv-task-side-image(?![^"]*cv-task-side-image--styx-photo-production)"/g,
    "aria-label=\"styx photo production image\" class=\"cv-task-side-image cv-task-side-image--styx-photo-production\""
  );

  html = html.replace(
    /class="([^"]*cv-task-meta-layout(?![^"]*cv-task-meta-layout--with-gallery)[^"]*)"([^>]*>\s*<aside[^>]*class="[^"]*cv-task-side-gallery)/g,
    "class=\"$1 cv-task-meta-layout--with-gallery\"$2"
  );

  writeRaw(css.html, html);
}

function fixKnownHasSelectors(text) {
  let out = text;

  out = out.replaceAll(
    ".cv-task-side-image:has(img[src*=\"/assets/styx/galleries/styx-photo-production/\"])",
    ".cv-task-side-image--styx-photo-production"
  );

  out = out.replaceAll(
    ".cv-section .cv-task-meta-layout--side-image:has(> .cv-task-side-gallery)",
    ".cv-section .cv-task-meta-layout--with-gallery"
  );

  out = out.replaceAll(
    ".cv-task-side-image--styx-photo-production img img",
    ".cv-task-side-image--styx-photo-production img"
  );

  return out;
}

function moveKeyframesToShowcase(text) {
  const names = ["cvMediaOrbit", "cvMediaMarquee"];
  const found = [];
  let out = text;

  for (const name of names) {
    const re = new RegExp("\\n?@keyframes\\s+" + name + "\\s*\\{[\\s\\S]*?\\n\\}\\n?", "gm");
    let first = "";
    out = out.replace(re, function (match) {
      if (!first) {
        first = match.trim();
      }
      return "\n";
    });
    if (first) {
      found.push(first);
    }
  }

  if (found.length) {
    out = out.trim() + "\n\n" + found.join("\n\n") + "\n";
  }

  return out;
}

function createCoreCss() {
  const design = read(css.oldDesignSystem);
  const reset = read(css.oldReset);
  const typography = read(css.oldTypography);

  const imports = []
    .concat(collectCssImports(design))
    .concat(collectCssImports(reset))
    .concat(collectCssImports(typography));

  let designBody = stripCssImports(design);
  let resetBody = stripCssImports(reset);
  let typographyBody = stripCssImports(typography);

  const hierarchyTypography = extractBlockByMarker(typographyBody, "hierarchy refactor typography");
  typographyBody = hierarchyTypography.rest;

  const core = []
    .concat(Array.from(new Set(imports)))
    .concat([
      "",
      section("core design tokens and design system", designBody),
      section("core reset", resetBody),
      section("core typography", typographyBody)
    ])
    .join("\n");

  write(css.core, core);

  return hierarchyTypography.block;
}

function createComponentsCss() {
  const body = [
    section("component chips", read(css.oldChips)),
    section("component tech list", read(css.oldTechList)),
    section("component awfulface", read(css.oldAwfulface)),
    section("component site footer", read(css.oldFooter))
  ].join("\n");

  write(css.components, body);
}

function createShowcaseCss(extraTypography) {
  const names = [
    "tokens.css",
    "base.css",
    "visual-surface.css",
    "editorial.css",
    "layout.css",
    "project.css",
    "task-legacy.css",
    "task.css",
    "project-hero.css",
    "media.css",
    "galleries-legacy.css",
    "galleries.css",
    "styx.css",
    "scanography.css",
    "jestei.css",
    "jestei-landing.css",
    "guards.css",
    "canvas.css",
    "lightbox.css"
  ];

  let combined = "";

  combined += section("showcase extracted typography", extraTypography);

  for (const name of names) {
    const file = "src/styles/sections/showcase/" + name;
    if (!exists(file)) continue;
    const title = "showcase " + name.replace(".css", "");
    let body = stripCssImports(read(file));
    body = stripNoise(body);
    combined += section(title, body);
  }

  const baseFromOld = read(css.showcase);
  if (baseFromOld) {
    combined += section("showcase previous consolidated file", baseFromOld);
  }

  combined += section("showcase structural hooks", [
    ".cv-task-domain--with-visual,",
    ".cv-task-domain--two-column,",
    ".cv-task-domain--two-column-compact,",
    ".cv-task-domain--media-left,",
    ".cv-task-domain--media-right,",
    ".cv-task-domain--collapse-on-mobile,",
    ".cv-task-domain--jestei-identity-showcase,",
    ".cv-task-gallery-split--static-row,",
    ".cv-task-group__visual--full,",
    ".cv-section--jobs,",
    ".cv-project-logo--jestei,",
    ".cv-project-hero--lyve,",
    ".cv-showcase-gallery-pair--jestei-identity,",
    ".cv-task-side-gallery--product-audiences,",
    ".cv-task-side-gallery--product-event,",
    ".cv-task-side-gallery--product-routes,",
    ".cv-jestei-landing-motion__split--club,",
    ".cv-jestei-landing-motion__split--event,",
    ".cv-jestei-landing-motion__tile-gallery--club,",
    ".cv-jestei-landing-motion__tile-gallery--event,",
    ".cv-task-list-group--auto,",
    ".cv-task-list-group__media,",
    ".cv-task-list-group__image-slot,",
    ".cv-task-list-group__title,",
    ".cv-embedded-demo__mount {",
    "  min-inline-size: 0;",
    "}",
    "",
    ".cv-embedded-demo__mount {",
    "  inline-size: 100%;",
    "}",
    "",
    ".cv-task-side-image--styx-photo-production {",
    "  overflow: hidden;",
    "}",
    "",
    ".cv-task-side-image--styx-photo-production img,",
    ".cv-task-side-image--styx-photo-production .cv-task-side-image__media,",
    ".cv-task-side-image--styx-photo-production .cv-task-side-media,",
    ".cv-task-side-image--styx-photo-production .cv-task-side-media__image {",
    "  inline-size: 100%;",
    "  block-size: 100%;",
    "  object-fit: cover;",
    "  object-position: center center;",
    "}",
    "",
    "@media (max-width: 68rem) {",
    "  .cv-task-domain--collapse-on-mobile .cv-task-group--with-visual,",
    "  .cv-task-domain--two-column .cv-task-group--with-visual,",
    "  .cv-task-domain--two-column-compact .cv-task-group--with-visual {",
    "    grid-template-columns: minmax(0, 1fr);",
    "  }",
    "}"
  ].join("\n"));

  combined = fixKnownHasSelectors(combined);
  combined = moveKeyframesToShowcase(combined);
  combined = removeImportant(combined);

  write(css.showcase, combined);
}

function rewriteIndex() {
  const imports = [
    "./core.css",
    "./components.css",
    "./sections/hero.css",
    "./sections/cv.css",
    "./sections/cv-list.css"
  ];

  if (exists(css.petProjects)) {
    imports.push("./sections/pet-projects.css");
  }

  imports.push("./sections/resume.css");
  imports.push("./sections/showcase.css");

  write(css.rootIndex, imports.map(function (item) {
    return "@import \"" + item + "\";";
  }).join("\n"));
}

function removeOldFilesAndDirs() {
  [
    css.oldDesignSystem,
    css.oldReset,
    css.oldTypography,
    css.importantOverrides,
    css.oldChips,
    css.oldTechList,
    css.oldAwfulface,
    css.oldFooter
  ].forEach(remove);

  if (exists(css.showcaseDir)) {
    fs.rmSync(abs(css.showcaseDir), { recursive: true, force: true });
    console.log("removed: " + css.showcaseDir);
  }

  ["src/styles/patterns", "src/styles/components"].forEach(function (dir) {
    if (fs.existsSync(abs(dir)) && fs.readdirSync(abs(dir)).length === 0) {
      fs.rmdirSync(abs(dir));
      console.log("removed empty dir: " + dir);
    }
  });
}

function normalizeSectionFiles() {
  [css.hero, css.cv, css.cvList, css.petProjects, css.resume].forEach(function (file) {
    if (!exists(file)) return;
    write(file, removeImportant(read(file)));
  });
}

function runBuild() {
  cp.execSync("npm run build", { stdio: "inherit" });
}

function listFiles(dir, extensions) {
  const result = [];
  const start = abs(dir);

  function walk(current) {
    if (!fs.existsSync(current)) return;

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(root, full).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (["node_modules", "dist", ".git", ".recovery", ".tmp", "coverage"].includes(entry.name)) continue;
        walk(full);
      } else if (extensions.includes(path.extname(entry.name).toLowerCase())) {
        result.push(rel);
      }
    }
  }

  walk(start);
  return result.sort();
}

function audit() {
  const cssFiles = listFiles("src/styles", [".css"]);

  function count(text, regex) {
    return (text.match(regex) || []).length;
  }

  const rows = cssFiles.map(function (file) {
    const text = read(file);
    return {
      path: file,
      kb: Number((Buffer.byteLength(text, "utf8") / 1024).toFixed(2)),
      lines: text.split("\n").length,
      imports: count(text, /@import\s+/g),
      important: count(text, /!important\b/g),
      has: count(text, /:has\(/g),
      media: count(text, /@media\b/g),
      vars: count(text, /--[A-Za-z0-9_-]+\s*:/g),
      keyframes: count(text, /@keyframes\s+/g)
    };
  }).sort(function (a, b) {
    return b.lines - a.lines;
  });

  const totals = rows.reduce(function (acc, row) {
    acc.important += row.important;
    acc.has += row.has;
    acc.keyframes += row.keyframes;
    return acc;
  }, { important: 0, has: 0, keyframes: 0 });

  const report = [
    "# CSS COLLAPSE REFACTOR AUDIT",
    "date: " + new Date().toISOString().replace("T", " ").slice(0, 19),
    "",
    "## totals",
    "css files: " + cssFiles.length,
    "important total: " + totals.important,
    ":has total: " + totals.has,
    "keyframes total: " + totals.keyframes,
    "important-overrides.css exists: " + exists(css.importantOverrides),
    "guards.css exists: " + exists(css.guards),
    "showcase directory exists: " + exists(css.showcaseDir),
    "",
    "## root index",
    read(css.rootIndex).trim(),
    "",
    "## css files",
    JSON.stringify(rows, null, 2)
  ].join("\n");

  try {
    cp.execSync("clip", { input: report });
  } catch (error) {}

  console.log(report);
}

addStyxPhotoClassToHtml();

const extraTypography = createCoreCss();
createComponentsCss();
createShowcaseCss(extraTypography);

ensureHeroRoot();
normalizeSectionFiles();
rewriteIndex();
removeOldFilesAndDirs();

if (exists(css.importantOverrides)) {
  throw new Error("important-overrides.css still exists");
}

if (exists(css.guards)) {
  throw new Error("guards.css still exists");
}

if (exists(css.showcaseDir)) {
  throw new Error("showcase directory still exists");
}

if (read(css.rootIndex).includes("important-overrides")) {
  throw new Error("root index still imports important-overrides");
}

runBuild();
audit();

console.log("DONE: CSS collapsed into core.css, components.css, page sections and one showcase.css. Build passed. Audit copied to clipboard.");
