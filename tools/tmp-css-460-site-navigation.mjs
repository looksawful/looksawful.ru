import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const componentsPath = new URL("../src/styles/components.css", import.meta.url);
const indexPath = new URL("../src/styles/index.css", import.meta.url);
const helperPath = new URL("../test/helpers/style-owner.mjs", import.meta.url);
const ownerPath = new URL("../src/styles/site-navigation.css", import.meta.url);

const startMarker = `/* ==================================================\n   Site navigation\n   ================================================== */`;
const endMarker = "/* One global project navigator replaces both the former projects index";
const experienceImport = '@import "./experience.css" layer(components);\n';
const ownerImport = '@import "./site-navigation.css" layer(components);\n';
const jesteiImport = '@import "../components/jestei-theme-organism/jestei-theme-organism.css";\n';
const oldHelperOwner = `  "site-navigation": Object.freeze({\n    path: "src/styles/components.css",\n    start: ".site-nav {",\n    end: "/* One global project navigator replaces both the former projects index",\n  }),`;
const newHelperOwner = `  "site-navigation": Object.freeze({\n    path: "src/styles/site-navigation.css",\n  }),`;

const [componentsBefore, indexBefore, helperBefore] = await Promise.all([
  readFile(componentsPath, "utf8"),
  readFile(indexPath, "utf8"),
  readFile(helperPath, "utf8"),
]);

if (existsSync(ownerPath)) throw new Error("site-navigation.css already exists before extraction");
if (indexBefore.includes(ownerImport)) throw new Error("site-navigation.css import already exists before extraction");
if (!helperBefore.includes(oldHelperOwner)) throw new Error("style-owner helper is not at the audited pre-extraction contract");

const start = componentsBefore.indexOf(startMarker);
if (start === -1 || start !== componentsBefore.lastIndexOf(startMarker)) {
  throw new Error("Expected exactly one Site navigation family marker in components.css");
}
const end = componentsBefore.indexOf(endMarker, start + startMarker.length);
if (end === -1) throw new Error("Missing project navigator marker after Site navigation family");

const extracted = componentsBefore.slice(start, end);
for (const required of [
  ".site-nav {",
  ".site-nav__bar {",
  ".site-nav__toggle {",
  ".site-nav__menu {",
  ".site-nav[data-menu-open] .site-nav__bar {",
  ".menu-preview {",
  ".menu-preview__image {",
  ".awfulface__background {",
  ".awfulface__morph-targets {",
  "@media (hover: hover) and (pointer: fine)",
  "@media (prefers-reduced-motion: no-preference)",
]) {
  if (!extracted.includes(required)) throw new Error(`Extracted navigation family is missing ${required}`);
}
if (extracted.includes(".project-nav {")) throw new Error("Global navigation extraction crossed into project-nav ownership");

const componentsAfter = componentsBefore.slice(0, start) + componentsBefore.slice(end);
for (const leaked of [
  /(?:^|\n)\.site-nav(?:\s|__|\[|\{|\.)/,
  /(?:^|\n)\.menu-preview(?:\s|__|\[|\{|\.)/,
  /(?:^|\n)\.awfulface__(?:background|morph-targets)\b/,
]) {
  if (leaked.test(componentsAfter)) throw new Error(`Global navigation selector remains in components.css: ${leaked}`);
}

const importAnchor = experienceImport + jesteiImport;
if (!indexBefore.includes(importAnchor) || indexBefore.indexOf(importAnchor) !== indexBefore.lastIndexOf(importAnchor)) {
  throw new Error("Expected one audited experience -> Jestei import boundary in index.css");
}
const indexAfter = indexBefore.replace(importAnchor, experienceImport + ownerImport + jesteiImport);
const helperAfter = helperBefore.replace(oldHelperOwner, newHelperOwner);

await Promise.all([
  writeFile(componentsPath, componentsAfter, "utf8"),
  writeFile(ownerPath, extracted, "utf8"),
  writeFile(indexPath, indexAfter, "utf8"),
  writeFile(helperPath, helperAfter, "utf8"),
]);

console.log(`Extracted site navigation owner byte-for-byte: ${Buffer.byteLength(extracted)} bytes`);
console.log(`components.css: ${componentsBefore.split("\n").length} -> ${componentsAfter.split("\n").length} lines`);
