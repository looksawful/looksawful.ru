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
          errors.push(
            `${rule.name}: selector family belongs to ${rule.owner}, found in ${file}`,
          );
          break;
        }
      }
    }
  }
  return errors;
}

export function findComponentsNoGrowthViolations(
  rawSource,
  residualFamilies = COMPONENTS_RESIDUAL_FAMILIES,
  compositionClasses = COMPONENTS_COMPOSITION_CLASSES,
) {
  const residual = new Set(residualFamilies);
  const composition = new Set(compositionClasses);
  const compositionFamilies = new Set(
    [...composition].map((className) => selectorFamily(className)),
  );
  const errors = [];
  const rejectedFamilies = new Set();

  for (const className of listClassNames(rawSource)) {
    if (composition.has(className)) continue;

    const family = selectorFamily(className);
    if (residual.has(family)) continue;

    if (compositionFamilies.has(family)) {
      errors.push(
        `components: selector .${className} is not an allowed composition seam`,
      );
      continue;
    }

    if (rejectedFamilies.has(family)) continue;
    rejectedFamilies.add(family);
    errors.push(
      `components: new durable selector family .${family} is not in the residual allowlist`,
    );
  }

  return errors;
}

function readImportGraph(source) {
  return (
    stripComments(source).match(/^[ \t]*@import\s+[^;\n]+;/gm) ?? []
  ).map((statement) => statement.trim());
}

function checkManifest(sources) {
  const source = sources.get("src/styles/index.css");
  if (!source) return ["manifest: missing src/styles/index.css"];

  const errors = [];
  if (!source.startsWith(EXPECTED_LAYER_ORDER)) {
    errors.push("manifest: canonical @layer order changed");
  }

  const actualImports = readImportGraph(source);
  if (
    actualImports.length !== EXPECTED_IMPORT_GRAPH.length ||
    actualImports.some(
      (statement, index) => statement !== EXPECTED_IMPORT_GRAPH[index],
    )
  ) {
    errors.push("manifest: canonical ordered import graph changed");
  }
  return errors;
}

function checkComponentsNoGrowth(sources) {
  const source = sources.get("src/styles/components.css");
  if (!source) return [];
  return findComponentsNoGrowthViolations(source);
}

function readIncomingField(header, name) {
  const pattern = new RegExp(
    `(?:^|\\n)\\s*\\*?\\s*${name}:\\s*([^\\n\\r*]+)`,
    "i",
  );
  return header.match(pattern)?.[1]?.trim() ?? "";
}

export function findIncomingLifecycleViolations(rawSource) {
  if (!stripComments(rawSource).trim()) return [];

  const markers = rawSource.match(/@incoming\b/g) ?? [];
  if (markers.length === 0) {
    return ["incoming: non-empty incoming.css requires @incoming lifecycle metadata"];
  }
  if (markers.length !== 1) {
    return [
      "incoming: incoming.css allows exactly one @incoming lifecycle header",
    ];
  }

  const header = rawSource.match(/\/\*[\s\S]*?@incoming\b[\s\S]*?\*\//)?.[0];
  if (!header) {
    return ["incoming: @incoming lifecycle metadata must be inside a CSS comment"];
  }

  const issue = readIncomingField(header, "issue");
  if (!/^#\d+$/.test(issue)) {
    return ["incoming: lifecycle header requires issue: #<number> metadata"];
  }

  if (!readIncomingField(header, "target")) {
    return ["incoming: lifecycle header requires non-empty target metadata"];
  }

  if (!readIncomingField(header, "reason")) {
    return ["incoming: lifecycle header requires non-empty reason metadata"];
  }

  if (!readIncomingField(header, "exit")) {
    return ["incoming: lifecycle header requires non-empty exit metadata"];
  }

  return [];
}

function checkIncoming(root) {
  const incomingPath = path.join(root, "src/styles/incoming.css");
  if (!existsSync(incomingPath)) return [];
  return findIncomingLifecycleViolations(readFileSync(incomingPath, "utf8"));
}

export function checkCssArchitecture(root) {
  const sources = readCssSources(root);
  return [
    ...findOwnerViolations(sources),
    ...checkManifest(sources),
    ...checkComponentsNoGrowth(sources),
    ...checkIncoming(root),
  ];
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const errors = checkCssArchitecture(root);
  if (errors.length) {
    console.error("CSS architecture check failed:\n");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `CSS architecture check passed (${OWNER_RULES.length} durable owner families + components residual no-growth + ordered manifest + incoming lifecycle).`,
    );
  }
}
