import { readFileSync, writeFileSync } from "node:fs";

const componentsPath = "src/styles/components.css";
const headerPath = "src/styles/project-header.css";
const indexPath = "src/styles/index.css";
const capturePath = "tools/design-capture/config.mjs";

const componentsOriginal = readFileSync(componentsPath, "utf8");
const compactOriginal = readFileSync(headerPath, "utf8");
const indexOriginal = readFileSync(indexPath, "utf8");
const captureOriginal = readFileSync(capturePath, "utf8");

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

const baseStart = componentsOriginal.indexOf(".project__head {");
const baseEnd = componentsOriginal.indexOf(".project__intro {", baseStart);
if (baseStart < 0 || baseEnd < 0 || baseEnd <= baseStart) {
  throw new Error("cannot isolate base project header family");
}
const baseBlock = componentsOriginal.slice(baseStart, baseEnd);
for (const selector of [".project__head", ".project__name", ".project__role", ".project__period"]) {
  if (!baseBlock.includes(selector)) throw new Error(`base header missing ${selector}`);
}
if (baseBlock.includes(".project__intro")) throw new Error("base header slice crossed into project intro");

const wideMarker = "@container project (width > 50rem) {";
requireOnce(componentsOriginal, wideMarker, "wide project container");
const wideStart = componentsOriginal.indexOf(wideMarker);
const wideHeaderStart = componentsOriginal.indexOf("  .project__head {", wideStart);
const wideHeaderEnd = componentsOriginal.indexOf("  .project__intro {", wideHeaderStart);
if (wideHeaderStart < 0 || wideHeaderEnd < 0 || wideHeaderEnd <= wideHeaderStart) {
  throw new Error("cannot isolate wide project header rules");
}
const wideHeaderBody = componentsOriginal.slice(wideHeaderStart, wideHeaderEnd);
if (!wideHeaderBody.includes("  .project__role {")) throw new Error("wide header slice missing role rule");
const wideBlock = `${wideMarker}\n${wideHeaderBody}}\n\n`;

const lateRule = "  .project__head {\n    line-height: var(--lh-heading);\n  }\n\n";
requireOnce(indexOriginal, lateRule, "late project header typography refinement");

let components = replaceOnce(componentsOriginal, baseBlock, "", "base project header family");
components = replaceOnce(components, wideHeaderBody, "", "wide project header family");

const canonicalHeader = `${baseBlock}${wideBlock}${compactOriginal}\n${lateRule}`.replace(/\n+$/, "\n");
let index = replaceOnce(indexOriginal, lateRule, "", "late project header typography refinement");

const captureMarker = 'name: "project-header"';
const captureStart = captureOriginal.indexOf(captureMarker);
const captureEnd = captureOriginal.indexOf("\n  },", captureStart);
if (captureStart < 0 || captureEnd < 0) throw new Error("cannot isolate Design Capture project-header entry");
const captureEntry = captureOriginal.slice(captureStart, captureEnd);
const oldHint = 'stylesheetHints: ["src/styles/components.css"]';
requireOnce(captureEntry, oldHint, "project-header Design Capture owner hint");
const newEntry = captureEntry.replace(oldHint, 'stylesheetHints: ["src/styles/project-header.css"]');
const capture = captureOriginal.slice(0, captureStart) + newEntry + captureOriginal.slice(captureEnd);

const aggregateSelector = /(?:^|\n)\s*\.project__(?:head|name|role|period)(?:\s|>|,|\{|\.)/;
if (aggregateSelector.test(components)) throw new Error("components.css still owns project header presentation");
if (/\.project__head\s*\{\s*line-height:\s*var\(--lh-heading\);\s*\}/.test(index)) {
  throw new Error("index.css still owns project header typography patch");
}

const baseOrder = canonicalHeader.indexOf(".project__head {\n  display: grid;");
const wideOrder = canonicalHeader.indexOf(wideMarker);
const compactOrder = canonicalHeader.indexOf("@container project (width <= 50rem)");
const typographyOrder = canonicalHeader.lastIndexOf(".project__head {\n    line-height: var(--lh-heading);");
if (!(baseOrder >= 0 && wideOrder > baseOrder && compactOrder > wideOrder && typographyOrder > compactOrder)) {
  throw new Error("canonical project-header source order is not preserved");
}

writeFileSync(componentsPath, components);
writeFileSync(headerPath, canonicalHeader);
writeFileSync(indexPath, index);
writeFileSync(capturePath, capture);

console.log(`project header base preserved: ${Buffer.byteLength(baseBlock)} bytes`);
console.log(`project header wide rules preserved: ${Buffer.byteLength(wideHeaderBody)} bytes`);
console.log(`project header compact owner preserved: ${Buffer.byteLength(compactOriginal)} bytes`);
console.log(`project header late typography rule preserved: ${Buffer.byteLength(lateRule)} bytes before EOF normalization`);
console.log(`components.css lines: ${componentsOriginal.split("\n").length} -> ${components.split("\n").length}`);
