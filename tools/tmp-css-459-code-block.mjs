import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const componentsPath = new URL("../src/styles/components.css", import.meta.url);
const indexPath = new URL("../src/styles/index.css", import.meta.url);
const ownerPath = new URL("../src/styles/code-block.css", import.meta.url);

const startMarker = "/* --- code-block --- */";
const nextMarker = "/* --- justified-gallery --- */";
const componentsImport = '@import "./components.css" layer(components);\n';
const ownerImport = '@import "./code-block.css" layer(components);\n';

const [componentsBefore, indexBefore] = await Promise.all([
  readFile(componentsPath, "utf8"),
  readFile(indexPath, "utf8"),
]);

if (existsSync(ownerPath)) throw new Error("code-block.css already exists before extraction");
if (indexBefore.includes(ownerImport)) throw new Error("code-block.css import already exists before extraction");

const start = componentsBefore.indexOf(startMarker);
const lastStart = componentsBefore.lastIndexOf(startMarker);
if (start === -1 || start !== lastStart) {
  throw new Error("Expected exactly one code-block family marker in components.css");
}

const end = componentsBefore.indexOf(nextMarker, start + startMarker.length);
if (end === -1) throw new Error("Missing justified-gallery marker after code-block family");

const extracted = componentsBefore.slice(start, end);
for (const required of [
  ".code-block {",
  ".code-block__head {",
  ".code-block__heading {",
  ".code-block__index {",
  ".code-block__title {",
  ".code-block__copy {",
  ".code-block pre {",
  ".code-block code {",
  ".code-block__meta {",
]) {
  if (!extracted.includes(required)) throw new Error(`Extracted family is missing ${required}`);
}

const componentsAfter = componentsBefore.slice(0, start) + componentsBefore.slice(end);
if (/(?:^|\n)\.code-block(?:\s|__|\{|\.)/.test(componentsAfter)) {
  throw new Error("A code-block presentation selector remains in components.css outside the extracted family");
}

const importOffset = indexBefore.indexOf(componentsImport);
if (importOffset === -1 || importOffset !== indexBefore.lastIndexOf(componentsImport)) {
  throw new Error("Expected exactly one components.css manifest import");
}
const indexAfter = indexBefore.replace(componentsImport, componentsImport + ownerImport);

await Promise.all([
  writeFile(componentsPath, componentsAfter, "utf8"),
  writeFile(ownerPath, extracted, "utf8"),
  writeFile(indexPath, indexAfter, "utf8"),
]);

console.log(`Extracted code-block owner byte-for-byte: ${Buffer.byteLength(extracted)} bytes`);
console.log(`components.css: ${componentsBefore.split("\n").length} -> ${componentsAfter.split("\n").length} lines`);
