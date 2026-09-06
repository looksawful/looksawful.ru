import { existsSync } from "node:fs";
import { readFile, writeFile, unlink } from "node:fs/promises";

const componentsPath = new URL("../src/styles/components.css", import.meta.url);
const indexPath = new URL("../src/styles/index.css", import.meta.url);
const legacyTopPath = new URL("../src/styles/project-navigation-top.css", import.meta.url);
const ownerPath = new URL("../src/styles/project-navigation.css", import.meta.url);
const mobileTestPath = new URL("../test/project-navigation-mobile-viewport.test.mjs", import.meta.url);

const startMarker = `/* One global project navigator replaces both the former projects index and\n   the four per-project chapter TOCs. Narrow view stays at the bottom; the\n   wide view reuses the existing left rail. */`;
const endMarker = `/* ==================================================\n   Project shell and typography\n   ================================================== */`;
const legacyImport = '@import "./project-navigation-top.css" layer(components);';
const ownerImport = '@import "./project-navigation.css" layer(components);';

const [componentsBefore, indexBefore, topBefore, mobileTestBefore] = await Promise.all([
  readFile(componentsPath, "utf8"),
  readFile(indexPath, "utf8"),
  readFile(legacyTopPath, "utf8"),
  readFile(mobileTestPath, "utf8"),
]);

if (existsSync(ownerPath)) throw new Error("project-navigation.css already exists before consolidation");
if (!existsSync(legacyTopPath)) throw new Error("project-navigation-top.css must exist before consolidation");
if (!indexBefore.includes(legacyImport) || indexBefore.indexOf(legacyImport) !== indexBefore.lastIndexOf(legacyImport)) {
  throw new Error("Expected exactly one legacy project-navigation-top.css import");
}
if (indexBefore.includes(ownerImport)) throw new Error("project-navigation.css import already exists before consolidation");

const start = componentsBefore.indexOf(startMarker);
if (start === -1 || start !== componentsBefore.lastIndexOf(startMarker)) {
  throw new Error("Expected exactly one project navigation family marker in components.css");
}
const end = componentsBefore.indexOf(endMarker, start + startMarker.length);
if (end === -1) throw new Error("Missing Project shell boundary after project navigation family");

const baseFamily = componentsBefore.slice(start, end);
for (const required of [
  ".project-nav {",
  ".project-nav__inner {",
  ".project-nav__list {",
  ".project-nav__link {",
  ".project-nav__index {",
  "[data-navigation-project] {",
  "@container projects (width > 96rem)",
  "@supports (scroll-target-group: auto)",
  "@supports selector(:target-current)",
]) {
  if (!baseFamily.includes(required)) throw new Error(`Base project navigation family is missing ${required}`);
}
if (baseFamily.includes(".project__head {")) throw new Error("Project navigation extraction crossed into project header ownership");

for (const required of [
  ".project-nav__top {",
  ".project-nav__top-label {",
  "env(safe-area-inset-bottom, 0px)",
  "@container projects (width <= 96rem)",
  "@container projects (width <= 40rem)",
  "@container projects (width > 96rem)",
]) {
  if (!topBefore.includes(required)) throw new Error(`Legacy top extension is missing ${required}`);
}

const componentsAfter = componentsBefore.slice(0, start) + componentsBefore.slice(end);
if (/(?:^|\n)\.project-nav(?:\s|__|\[|\{|\.)/.test(componentsAfter)) {
  throw new Error("A project-nav selector remains in components.css after extraction");
}
if (/(?:^|\n)\[data-navigation-project\]\s*\{/.test(componentsAfter)) {
  throw new Error("data-navigation-project presentation remains in components.css after extraction");
}

const owner = baseFamily.endsWith("\n") ? `${baseFamily}${topBefore}` : `${baseFamily}\n${topBefore}`;
const baseOffset = owner.indexOf(".project-nav {");
const topOffset = owner.indexOf(".project-nav__top {");
if (baseOffset === -1 || topOffset === -1 || baseOffset >= topOffset) {
  throw new Error("Canonical owner would not preserve base-before-extension order");
}

const indexAfter = indexBefore.replace(legacyImport, ownerImport);

const replacements = [
  [
`  const [components, topStyles] = await Promise.all([\n    read("src/styles/components.css"),\n    read("src/styles/project-navigation-top.css"),\n  ]);\n  const base = blockBetween(components, ".project-nav {", ".project-nav__inner {");`,
`  const owner = await read("src/styles/project-navigation.css");\n  const base = blockBetween(owner, ".project-nav {", ".project-nav__inner {");`,
  ],
  ["  assert.match(topStyles, /env\\(safe-area-inset-bottom,\\s*0px\\)/);", "  assert.match(owner, /env\\(safe-area-inset-bottom,\\s*0px\\)/);"],
  [
`  const components = await read("src/styles/components.css");\n  const base = blockBetween(components, ".project-nav {", ".project-nav__inner {");`,
`  const owner = await read("src/styles/project-navigation.css");\n  const base = blockBetween(owner, ".project-nav {", ".project-nav__inner {");`,
  ],
  [
`  const [source, interactive, topStyles] = await Promise.all([\n    read("src/components/project-navigation.ts"),\n    read("src/interactive.ts"),\n    read("src/styles/project-navigation-top.css"),\n  ]);`,
`  const [source, interactive, owner] = await Promise.all([\n    read("src/components/project-navigation.ts"),\n    read("src/interactive.ts"),\n    read("src/styles/project-navigation.css"),\n  ]);`,
  ],
  ["  assert.doesNotMatch(topStyles, /data-viewport-anchor|project-nav-viewport-offset/);", "  assert.doesNotMatch(owner, /data-viewport-anchor|project-nav-viewport-offset/);"],
  [
`  const components = await read("src/styles/components.css");\n  const wideStart = components.indexOf("@container projects (width > 96rem)");`,
`  const owner = await read("src/styles/project-navigation.css");\n  const wideStart = owner.indexOf("@container projects (width > 96rem)");`,
  ],
  ["  const wide = components.slice(wideStart);", "  const wide = owner.slice(wideStart);"],
];

let mobileTestAfter = mobileTestBefore;
for (const [before, after] of replacements) {
  const first = mobileTestAfter.indexOf(before);
  if (first === -1 || first !== mobileTestAfter.lastIndexOf(before)) {
    throw new Error(`Expected exactly one audited mobile-test source pattern: ${before.slice(0, 80)}`);
  }
  mobileTestAfter = mobileTestAfter.replace(before, after);
}
if (/project-navigation-top\.css|read\("src\/styles\/components\.css"\)/.test(mobileTestAfter)) {
  throw new Error("Mobile viewport test still reads split project navigation CSS owners");
}

await Promise.all([
  writeFile(componentsPath, componentsAfter, "utf8"),
  writeFile(ownerPath, owner, "utf8"),
  writeFile(indexPath, indexAfter, "utf8"),
  writeFile(mobileTestPath, mobileTestAfter, "utf8"),
]);
await unlink(legacyTopPath);

console.log(`Project navigation base extracted byte-for-byte: ${Buffer.byteLength(baseFamily)} bytes`);
console.log(`Project navigation top extension preserved byte-for-byte: ${Buffer.byteLength(topBefore)} bytes`);
console.log(`components.css: ${componentsBefore.split("\n").length} -> ${componentsAfter.split("\n").length} lines`);
