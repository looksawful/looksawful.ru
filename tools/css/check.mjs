import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OWNER_RULES = Object.freeze([
  Object.freeze({
    name: "site-navigation",
    owner: "src/styles/site-navigation.css",
    patterns: [
      /\.site-nav(?:__[\w-]+)?(?=[\s,{.:#>\[])/,
      /\.menu-preview(?:__[\w-]+)?(?=[\s,{.:#>\[])/,
      /\.awfulface__(?:background|morph-targets)\b/,
    ],
  }),
  Object.freeze({
    name: "project-navigation",
    owner: "src/styles/project-navigation.css",
    patterns: [
      /\.project-nav(?:__[\w-]+)?(?=[\s,{.:#>\[])/,
      /\[data-navigation-project\]/,
    ],
  }),
  Object.freeze({
    name: "project-header",
    owner: "src/styles/project-header.css",
    patterns: [/\.project__(?:head|name|role|period)(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "project-shell",
    owner: "src/styles/project-shell.css",
    patterns: [
      /\.project__(?:intro|title|summary|lead|links)(?=[\s,{.:#>\[])/,
      /\.section-copy(?:__(?:title|text))?(?=[\s,{.:#>\[])/,
    ],
  }),
  Object.freeze({
    name: "expertise",
    owner: "src/styles/expertise.css",
    patterns: [/\.expertise__[\w-]+(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "experience",
    owner: "src/styles/experience.css",
    patterns: [/\.experience__[\w-]+(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "media-core",
    owner: "src/styles/media.css",
    patterns: [/\.media-group__head(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "code-block",
    owner: "src/styles/code-block.css",
    patterns: [/\.code-block(?:__[\w-]+)?(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "before-after",
    owner: "src/styles/before-after.css",
    patterns: [/(?:^|[\n{}])\s*\.before-after(?:__[\w-]+)?(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "page-flip",
    owner: "src/styles/page-flip.css",
    patterns: [/(?:^|[\n{}])\s*\.page-flip(?:__[\w-]+)?(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "slider",
    owner: "src/styles/slider.css",
    allowedSelectors: Object.freeze({
      "src/styles/captions.css": Object.freeze([
        /\.slider\[data-media-deck\]\s+\[data-slide-caption\]:not\(\[data-caption-view="full"\]\)/g,
      ]),
    }),
    patterns: [
      /(?:^|[\n{}])\s*\.slider(?:__[\w-]+)?(?=[\s,{.:#>\[])/,
      /(?:^|[\n{}])\s*\.slider-controls(?:__[\w-]+)?(?=[\s,{.:#>\[])/,
    ],
  }),
  Object.freeze({
    name: "media-deck",
    owner: "src/styles/media-deck.css",
    patterns: [
      /(?:^|[\n{}])\s*\[data-media-deck\](?=[\s,{.:#>\[])/,
      /(?:^|[\n{}])\s*\.media-deck(?:__[\w-]+)?(?=[\s,{.:#>\[])/,
      /(?:^|[\n{}])\s*\[data-deck-(?:dragging|fit(?:-viewport)?)\](?=[\s,{.:#>\[])/,
    ],
  }),
  Object.freeze({
    name: "media-lightbox",
    owner: "src/styles/media-lightbox.css",
    patterns: [
      /(?:^|[\n{}])\s*\[data-lightbox-source\](?=\s*\{)/,
      /(?:^|[\n{}])\s*\.media-lightbox__(?:layout|figure|button|prev|next|close|video-slide)\b/,
    ],
  }),
]);

const COMPONENTS_RESIDUAL_FAMILIES = Object.freeze([
  "hero",
  "projects-grid",
  "portfolio-showcase",
  "portfolio-logo-wall",
  "project-card",
  "tools",
  "contact",
  "divider",
  "group-note",
  "editorial-note",
  "credits",
  "brand-system",
  "jestei-section-copy-list",
  "jestei-interface-group",
  "jestei-event-group",
  "jestei-captioned-group",
  "jestei-captioned-media",
  "jestei-media",
  "jestei-event-video-deck",
  "feature-layout",
  "resource-row",
  "mockup",
  "browser-screen",
  "terminal",
  "moves-awful-interactive",
  "browser-mockup",
  "moves-awful-stage",
  "animated-canvas-gallery",
  "gallery-title-pile",
  "variant-tabs",
  "variant-tab",
  "awful-cases-game",
  "runner-game-shell",
  "game-title",
  "start",
  "restart",
  "runner-controls",
  "jestei-filter-mockup",
  "justified-gallery",
  "berserk-audio",
  "mobile-mockup",
]);

const COMPONENTS_COMPOSITION_CLASSES = Object.freeze([
  "expertise",
  "experience",
  "project__section",
  "project__footer",
  "media",
  "media__caption",
  "media__surface",
  "media-group",
  "media-group__items",
  "slider",
  "slider__viewport",
  "slider__slides",
  "slider__slide",
  "slider-controls",
  "code-block-grid",
  "grid",
  "is-active",
]);

const EXPECTED_IMPORT_GRAPH = Object.freeze([
  '@import "@fontsource-variable/inter/wght.css";',
  '@import "./reset.css" layer(reset);',
  '@import "./tokens.css" layer(tokens);',
  '@import "./colors.css" layer(colors);',
  '@import "./base.css" layer(base);',
  '@import "./patterns.css" layer(patterns);',
  '@import "./media.css" layer(components);',
  '@import "./components.css" layer(components);',
  '@import "./before-after.css" layer(components);',
  '@import "./code-block.css" layer(components);',
  '@import "./project-header.css" layer(components);',
  '@import "./project-navigation.css" layer(components);',
  '@import "./project-shell.css" layer(components);',
  '@import "./expertise.css" layer(components);',
  '@import "./experience.css" layer(components);',
  '@import "./site-navigation.css" layer(components);',
  '@import "./page-flip.css" layer(components);',
  '@import "./slider.css" layer(components);',
  '@import "./media-deck.css" layer(components);',
  '@import "./media-lightbox.css" layer(components);',
  '@import "./gallery.css" layer(components);',
  '@import "../components/jestei-theme-organism/jestei-theme-organism.css";',
  '@import "./captions.css" layer(captions);',
  '@import "./motion.css" layer(motion);',
  '@import "./utilities.css" layer(utilities);',
]);

const EXPECTED_LAYER_ORDER =
  "@layer reset, tokens, colors, base, patterns, components, captions, motion, utilities;";

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripQuotedStrings(source) {
  return source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
}

function selectorFamily(className) {
  return className.split(/__|--/, 1)[0];
}

function listClassNames(rawSource) {
  const source = stripQuotedStrings(stripComments(rawSource));
  const classNames = [];
  const seen = new Set();
  for (const match of source.matchAll(/\.([_a-zA-Z][\w-]*)/g)) {
    const className = match[1];
    if (seen.has(className)) continue;
    seen.add(className);
    classNames.push(className);
  }
  return classNames;
}

function normalizeSimpleGroupedSelectors(source) {
  return source.replace(
    /(^|[\n{}])([ \t]*[^{}\n;():]+)(?=\s*\{)/g,
    (_match, boundary, prelude) => `${boundary}${prelude.replaceAll(",", "\n")}`,
  );
}

function maskAllowedSelectors(source, file, rule) {
  const allowed = rule.allowedSelectors?.[file] ?? [];
  return allowed.reduce(
    (masked, pattern) => masked.replace(pattern, ".css-owner-allowed-seam"),
    source,
  );
}

function listCssFiles(root) {
  const srcRoot = path.join(root, "src");
  return readdirSync(srcRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".css"))
    .map((entry) => {
      const absolute = path.join(entry.parentPath, entry.name);
      return path.relative(root, absolute).replaceAll(path.sep, "/");
    })
    .sort();
}

function readCssSources(root) {
  return new Map(
    listCssFiles(root).map((file) => [
      file,
      readFileSync(path.join(root, file), "utf8"),
    ]),
  );
}

export function findOwnerViolations(sources, rules = OWNER_RULES) {
  const errors = [];
  for (const rule of rules) {
    for (const [file, rawSource] of sources) {
      if (file === rule.owner) continue;
      const source = normalizeSimpleGroupedSelectors(
        maskAllowedSelectors(stripComments(rawSource), file, rule),
      );
      for (const pattern of rule.patterns) {
        if (pattern.test(source)) {
          errors.push(`${rule.name}: ${file} duplicates selectors owned by ${rule.owner}`);
          break;
        }
      }
    }
  }
  return errors;
}

export function findComponentsResidualViolations(source) {
  const classNames = listClassNames(source);
  const allowed = new Set(COMPONENTS_COMPOSITION_CLASSES);
  return classNames
    .map(selectorFamily)
    .filter((family, index, families) => families.indexOf(family) === index)
    .filter((family) => COMPONENTS_RESIDUAL_FAMILIES.includes(family))
    .filter((family) => !allowed.has(family))
    .map((family) => `components residual: durable family .${family} remains in src/styles/components.css`);
}

export function assertManifestImportGraph(source) {
  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("@import "));
  if (lines.length !== EXPECTED_IMPORT_GRAPH.length) {
    throw new Error(`stylesheet manifest import count drift: expected ${EXPECTED_IMPORT_GRAPH.length}, got ${lines.length}`);
  }
  EXPECTED_IMPORT_GRAPH.forEach((expected, index) => {
    if (lines[index] !== expected) {
      throw new Error(`stylesheet manifest import drift at ${index + 1}: expected ${expected}, got ${lines[index] ?? "missing"}`);
    }
  });
}

function runCli() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const indexFile = path.join(root, "src/styles/index.css");
  if (!existsSync(indexFile)) {
    throw new Error(`stylesheet manifest missing: ${indexFile}`);
  }
  const sources = readCssSources(root);
  const ownerViolations = findOwnerViolations(sources);
  const residualViolations = findComponentsResidualViolations(
    sources.get("src/styles/components.css") ?? "",
  );
  assertManifestImportGraph(readFileSync(indexFile, "utf8"));
  const errors = [...ownerViolations, ...residualViolations];
  if (errors.length) {
    throw new Error(errors.join("\n"));
  }
  console.log(`[css-check] ${sources.size} stylesheets checked; canonical manifest verified.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
