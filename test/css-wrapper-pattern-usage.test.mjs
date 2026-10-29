import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const patterns = readFileSync(new URL("../src/styles/patterns.css", import.meta.url), "utf8");
const projectShell = readFileSync(new URL("../src/styles/project-shell.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const homePage = readFileSync(new URL("../src/site/renderers/home/home-page.ts", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("project outer content widths delegate to wrapper", () => {
  assert.match(patterns, /\.wrapper\s*\{[\s\S]*?inline-size:\s*min\([\s\S]*?margin-inline:\s*auto;/);
  assert.match(homePage, /class="project-preview-entry wrapper"/);
  assert.match(index, /class="project__footer wrapper cluster"/);
  assert.match(projectShell, /\.project-preview-entry\s*\{[\s\S]*?--wrapper-gutter:\s*var\(--project-gutter\);[\s\S]*?--wrapper-max-width:\s*var\(--content-max-width\);/);
  assert.match(components, /\.project__footer\s*\{[\s\S]*?--wrapper-gutter:\s*var\(--project-gutter\);[\s\S]*?--wrapper-max-width:\s*var\(--content-max-width\);/);
  assert.doesNotMatch(projectShell, /\.project-preview-entry\s*\{[\s\S]*?inline-size:\s*min\(calc\(100%/);
  assert.doesNotMatch(components, /\.project__footer\s*\{[\s\S]*?inline-size:\s*min\(calc\(100%/);
});
