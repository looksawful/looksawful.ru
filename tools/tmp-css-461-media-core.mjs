import { existsSync, readFileSync, writeFileSync } from "node:fs";

const componentsPath = "src/styles/components.css";
const indexPath = "src/styles/index.css";
const ownerPath = "src/styles/media.css";

if (existsSync(ownerPath)) throw new Error("media.css already exists before Wave 5A transform");

const componentsOriginal = readFileSync(componentsPath, "utf8");
const indexOriginal = readFileSync(indexPath, "utf8");

function count(source, needle) {
  return source.split(needle).length - 1;
}

function requireOnce(source, needle, label) {
  const seen = count(source, needle);
  if (seen !== 1) throw new Error(`${label}: expected exactly once, found ${seen}`);
}

function replaceOnce(source, needle, replacement, label) {
  requireOnce(source, needle, label);
  return source.replace(needle, replacement);
}

const marker = "/* ==================================================\n   Media item\n   ================================================== */\n";
const integrationStart = ".project__section > :is(.media, .mockup, .slider):only-child {";
requireOnce(componentsOriginal, marker, "media item marker");
requireOnce(componentsOriginal, integrationStart, "project/media integration boundary");

const start = componentsOriginal.indexOf(marker);
const end = componentsOriginal.indexOf(integrationStart, start);
if (start < 0 || end <= start) throw new Error("cannot isolate contiguous media core block");

const coreBlock = componentsOriginal.slice(start, end);
for (const required of [
  ".media {",
  ".media__surface {",
  "--media-fit: cover;",
  "--media-position: center;",
  "--media-ratio: auto;",
  "object-fit: var(--object-fit, var(--media-fit));",
  "object-position: var(--object-position, var(--media-position));",
  '&[data-layout="pair"]',
  '&[data-layout="triptych"]',
  ".media__surface.media__surface--center-crop {",
  ".media__surface.media__surface--center-crop > video {",
]) {
  if (!coreBlock.includes(required)) throw new Error(`media core block missing ${required}`);
}
for (const excluded of [".media-group {", ".media__caption", ".project__section >"]) {
  if (coreBlock.includes(excluded)) throw new Error(`media core block crossed excluded boundary ${excluded}`);
}

let components = replaceOnce(componentsOriginal, coreBlock, "", "media core block");
let index = indexOriginal;

const oldImports = '@import "./expertise.css" layer(components);\n@import "./experience.css" layer(components);';
const newImports = '@import "./expertise.css" layer(components);\n@import "./media.css" layer(components);\n@import "./experience.css" layer(components);';
index = replaceOnce(index, oldImports, newImports, "media manifest slot");

const owner = coreBlock.replace(/\n+$/, "\n");
const order = [
  owner.indexOf(marker),
  owner.indexOf(".media {"),
  owner.indexOf(".media__surface {"),
  owner.indexOf(".media__surface.media__surface--center-crop {"),
  owner.indexOf(".media__surface.media__surface--center-crop > video {"),
];
if (order.some((value) => value < 0) || order.some((value, index) => index > 0 && value <= order[index - 1])) {
  throw new Error(`media core source order was not preserved: ${order.join(", ")}`);
}

if (/(?:^|\n)\.media\s*\{/.test(components)) throw new Error("components.css still owns generic .media");
if (/(?:^|\n)\.media__surface\s*\{/.test(components)) throw new Error("components.css still owns generic .media__surface");
if (/\.media__surface\.media__surface--center-crop/.test(components)) throw new Error("components.css still owns center-crop media core");
if (!/\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child\s*\{/.test(components)) {
  throw new Error("project/media integration boundary must remain in components.css");
}
if (!/(?:^|\n)\.media-group\s*\{/.test(components)) throw new Error("media-group foundation must remain outside Wave 5A");
if (/(?:^|\n)\.media-group(?:\s|__|\[|\{|\.)/.test(owner)) throw new Error("media.css absorbed media-group ownership");
if (/(?:^|\n)\.media__caption(?:\s|__|\{|\.)/.test(owner)) throw new Error("media.css absorbed caption ownership");
if (/(?:^|\n)\.project__section\s*>/.test(owner)) throw new Error("media.css absorbed project integration ownership");

writeFileSync(componentsPath, components);
writeFileSync(indexPath, index);
writeFileSync(ownerPath, owner);

console.log(`media core preserved: ${Buffer.byteLength(coreBlock)} bytes`);
console.log(`media.css: ${owner.split("\n").length - 1} lines`);
console.log(`components.css lines: ${componentsOriginal.split("\n").length} -> ${components.split("\n").length}`);
