import { existsSync, readFileSync, writeFileSync } from "node:fs";

const componentsPath = "src/styles/components.css";
const indexPath = "src/styles/index.css";
const ownerPath = "src/styles/project-shell.css";

if (existsSync(ownerPath)) throw new Error("project-shell.css already exists before Wave 4D transform");

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

const shellMarker = "/* ==================================================\n   Project shell and typography\n   ================================================== */\n";
requireOnce(componentsOriginal, shellMarker, "project shell marker");
const shellStart = componentsOriginal.indexOf(shellMarker);
const shellEnd = componentsOriginal.indexOf(".divider {", shellStart);
if (shellStart < 0 || shellEnd < 0 || shellEnd <= shellStart) {
  throw new Error("cannot isolate contiguous project shell block");
}
const baseBlock = componentsOriginal.slice(shellStart, shellEnd);

for (const selector of [
  ".projects {",
  ".project {",
  ".project__intro {",
  ".project__title {",
  ".project__summary {",
  ".project__lead,",
  ".text-lead {",
  ".project__links {",
  ".project__section {",
  ".section-copy {",
  ".section-copy__title {",
  ".section-copy__text {",
]) {
  if (!baseBlock.includes(selector)) throw new Error(`project shell base block missing ${selector}`);
}
if (!baseBlock.includes('.project > :is(.media, .slider) {')) {
  throw new Error("project shell base block must preserve direct standalone media outer contract");
}
for (const excluded of [".divider {", ".group-note,", ".editorial-note", ".credits {"]) {
  if (baseBlock.includes(excluded)) throw new Error(`project shell base block crossed excluded boundary ${excluded}`);
}

const lateStartNeedle = "  .project__title {\n";
const lateEndNeedle = "  .group-note,\n";
requireOnce(indexOriginal, lateStartNeedle, "project shell late typography start");
requireOnce(indexOriginal, lateEndNeedle, "project shell late typography end");
const lateStart = indexOriginal.indexOf(lateStartNeedle);
const lateEnd = indexOriginal.indexOf(lateEndNeedle, lateStart);
if (lateEnd <= lateStart) throw new Error("cannot isolate late project shell typography block");
const lateBlock = indexOriginal.slice(lateStart, lateEnd);
for (const selector of [
  "  .project__title {",
  "  .project__summary {",
  "  .project__lead,",
  "  .text-lead {",
  "  .section-copy__title {",
  "  .section-copy__text {",
  "  .project__section > :is(h2, h3),",
  "  .project__section > p:not([class]),",
]) {
  if (!lateBlock.includes(selector)) throw new Error(`late project shell block missing ${selector}`);
}
if (lateBlock.includes(".group-note")) throw new Error("late project shell block crossed into group-note ownership");

let components = replaceOnce(componentsOriginal, baseBlock, "", "project shell base block");
let index = replaceOnce(indexOriginal, lateBlock, "", "project shell late typography block");

const oldImports = '@import "./project-header.css" layer(components);\n@import "./project-navigation.css" layer(components);\n@import "./expertise.css" layer(components);';
const newImports = '@import "./project-header.css" layer(components);\n@import "./project-navigation.css" layer(components);\n@import "./project-shell.css" layer(components);\n@import "./expertise.css" layer(components);';
index = replaceOnce(index, oldImports, newImports, "project shell manifest slot");

const owner = `${baseBlock}${lateBlock}`.replace(/\n+$/, "\n");
const ownerOrder = [
  owner.indexOf(shellMarker),
  owner.indexOf(".project {"),
  owner.indexOf(".project__intro {"),
  owner.indexOf("@container project (width > 50rem)"),
  owner.indexOf(".section-copy {"),
  owner.lastIndexOf("  .project__title {"),
  owner.lastIndexOf("  .project__section > p:not([class]),"),
];
if (ownerOrder.some((value) => value < 0) || ownerOrder.some((value, index) => index > 0 && value <= ownerOrder[index - 1])) {
  throw new Error(`project shell source order was not preserved: ${ownerOrder.join(", ")}`);
}

for (const forbidden of [
  /(?:^|\n)\.projects\s*\{/,
  /(?:^|\n)\.project\s*\{/,
  /(?:^|\n)\s*\.project__(?:intro|title|summary|lead|links)(?:\s|>|,|\{|\.)/,
  /(?:^|\n)\s*\.project__section\s*\{/,
  /(?:^|\n)\s*\.project__section\s*>\s*:is\(h2, h3\)/,
  /(?:^|\n)\s*\.project__section\s*>\s*p:not\(\[class\]\)/,
]) {
  if (forbidden.test(components)) throw new Error(`components.css still owns project shell presentation: ${forbidden}`);
}
if (/(?:^|\n)\.section-copy(?:\s|__|\{|\.)/.test(components)) throw new Error("components.css still owns section-copy presentation");
if (/(?:^|\n)\.text-lead\s*\{/.test(components)) throw new Error("components.css still owns text-lead presentation");
if (!/\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child\s*\{/.test(components)) {
  throw new Error("media integration boundary must remain in components.css during Wave 4D");
}
if (/\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child\s*\{/.test(owner)) {
  throw new Error("project-shell.css must not absorb the media integration boundary");
}
if (/\.project__title\s*\{/.test(index) || /\.section-copy__title\s*\{/.test(index)) {
  throw new Error("index.css still owns project shell late typography");
}

writeFileSync(componentsPath, components);
writeFileSync(indexPath, index);
writeFileSync(ownerPath, owner);

console.log(`project shell base preserved: ${Buffer.byteLength(baseBlock)} bytes`);
console.log(`project shell late refinements preserved: ${Buffer.byteLength(lateBlock)} bytes`);
console.log(`project-shell.css: ${owner.split("\n").length - 1} lines`);
console.log(`components.css lines: ${componentsOriginal.split("\n").length} -> ${components.split("\n").length}`);