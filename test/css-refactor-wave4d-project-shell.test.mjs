import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const indexPath = new URL("../src/styles/index.css", import.meta.url);
const componentsPath = new URL("../src/styles/components.css", import.meta.url);
const ownerPath = new URL("../src/styles/project-shell.css", import.meta.url);

const index = readFileSync(indexPath, "utf8");
const components = readFileSync(componentsPath, "utf8");

test("project shell has one canonical stylesheet owner at the project-navigation boundary", () => {
  assert.equal(existsSync(ownerPath), true, "src/styles/project-shell.css must exist");
  assert.match(
    index,
    /@import "\.\/project-navigation\.css" layer\(components\);\n@import "\.\/project-shell\.css" layer\(components\);\n@import "\.\/expertise\.css" layer\(components\);/,
  );
});

test("components aggregate no longer owns project shell and section-copy presentation", () => {
  assert.doesNotMatch(components, /(?:^|\n)\.projects\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\.project\s*\{/);
  assert.doesNotMatch(
    components,
    /(?:^|\n)\s*\.project__(?:intro|title|summary|lead|links|section)(?:\s|>|,|\{|\.)/,
  );
  assert.doesNotMatch(components, /(?:^|\n)\.section-copy(?:\s|__|\{|\.)/);
  assert.doesNotMatch(components, /(?:^|\n)\.text-lead\s*\{/);
});

test("index no longer carries late project shell typography patches", () => {
  const withoutImport = index.replace(/@import "\.\/project-shell\.css" layer\(components\);\n?/, "");
  for (const selector of [
    ".project__title",
    ".project__summary",
    ".project__lead",
    ".text-lead",
    ".section-copy__title",
    ".section-copy__text",
  ]) {
    assert.doesNotMatch(withoutImport, new RegExp(`\\${selector.replaceAll("__", "__")}\\s*\\{`));
  }
  assert.doesNotMatch(withoutImport, /\.project__section\s*>\s*:is\(h2, h3\)/);
  assert.doesNotMatch(withoutImport, /\.project__section\s*>\s*p:not\(\[class\]\)/);
});

test("canonical project shell preserves base, responsive and late-refinement source order", () => {
  assert.equal(existsSync(ownerPath), true, "project-shell.css must exist");
  if (!existsSync(ownerPath)) return;

  const owner = readFileSync(ownerPath, "utf8");
  const base = owner.indexOf("/* ==================================================\n   Project shell and typography");
  const project = owner.indexOf(".project {", base);
  const intro = owner.indexOf(".project__intro {", project);
  const wide = owner.indexOf("@container project (width > 50rem)", intro);
  const sectionCopy = owner.indexOf(".section-copy {", wide);
  const lateTitle = owner.lastIndexOf("  .project__title {");
  const lateSectionText = owner.lastIndexOf("  .project__section > p:not([class]),");

  assert.ok(base >= 0, "missing project-shell family marker");
  assert.ok(project > base, "project base must follow the family marker");
  assert.ok(intro > project, "project intro must follow project base");
  assert.ok(wide > intro, "wide project-shell rules must follow base rules");
  assert.ok(sectionCopy > wide, "section-copy contract must follow project responsive rules");
  assert.ok(lateTitle > sectionCopy, "late typography refinements must remain after base section-copy rules");
  assert.ok(lateSectionText > lateTitle, "late project-section copy refinement must remain in original order");

  assert.match(owner, /\.project\s*>\s*:is\(\.media, \.slider\)/);
  assert.match(owner, /@container project-section \(width > 45rem\)/);

  // Cross-cutting media/content helpers intentionally remain outside this owner.
  assert.doesNotMatch(owner, /(?:^|\n)\.group-note\b/);
  assert.doesNotMatch(owner, /(?:^|\n)\.editorial-note\b/);
  assert.doesNotMatch(owner, /(?:^|\n)\.credits\b/);
  assert.doesNotMatch(owner, /(?:^|\n)\.divider\b/);
});
