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
    name: "code-block",
    owner: "src/styles/code-block.css",
    patterns: [/\.code-block(?:__[\w-]+)?(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "before-after",
    owner: "src/styles/before-after.css",
    patterns: [/(?:^|\n)\.before-after(?:__[\w-]+)?(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "page-flip",
    owner: "src/styles/page-flip.css",
    patterns: [/(?:^|\n)\.page-flip(?:__[\w-]+)?(?=[\s,{.:#>\[])/],
  }),
  Object.freeze({
    name: "slider",
    owner: "src/styles/slider.css",
    patterns: [
      /(?:^|\n)\.slider(?:__[\w-]+)?(?=[\s,{.:#>\[])/,
      /(?:^|\n)\.slider-controls(?:__[\w-]+)?(?=[\s,{.:#>\[])/,
    ],
  }),
  Object.freeze({
    name: "media-deck",
    owner: "src/styles/media-deck.css",
    patterns: [
      /(?:^|\n)\[data-media-deck\](?=[\s,{.:#>\[])/,
      /(?:^|\n)\.media-deck(?:__[\w-]+)?(?=[\s,{.:#>\[])/,
      /(?:^|\n)\[data-deck-(?:dragging|fit(?:-viewport)?)\](?=[\s,{.:#>\[])/,
    ],
  }),
]);

const REQUIRED_COMPONENT_IMPORTS = Object.freeze([
  "./before-after.css",
  "./page-flip.css",
  "./slider.css",
  "./media-deck.css",
  "./code-block.css",
  "./project-header.css",
  "./project-navigation.css",
  "./site-navigation.css",
]);

const EXPECTED_LAYER_ORDER =
  "@layer reset, tokens, colors, base, patterns, components, captions, motion, utilities;";

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
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
      const source = stripComments(rawSource);
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

function checkManifest(sources) {
  const source = sources.get("src/styles/index.css");
  if (!source) return ["manifest: missing src/styles/index.css"];

  const errors = [];
  if (!source.startsWith(EXPECTED_LAYER_ORDER)) {
    errors.push("manifest: canonical @layer order changed");
  }

  for (const importPath of REQUIRED_COMPONENT_IMPORTS) {
    const statement = `@import "${importPath}" layer(components);`;
    if (!source.includes(statement)) {
      errors.push(`manifest: missing canonical import ${statement}`);
    }
  }
  return errors;
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
      "CSS architecture check passed (8 durable owner families + manifest + incoming lifecycle).",
    );
  }
}
