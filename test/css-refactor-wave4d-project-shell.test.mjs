import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const indexPath = new URL("../src/styles/index.css", import.meta.url);
const componentsPath = new URL("../src/styles/components.css", import.meta.url);
const mediaPath = new URL("../src/styles/media.css", import.meta.url);
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
    /(?:^|\n)\s*\.project__(?:intro|title|summary|lead|links)(?:\s|>|,|\{|\.)/,
  );
  assert.doesNotMatch(components, /(?:^|\n)\s*\.project__section\s*\{/);
  assert.doesNotMatch(components, /(?:^|\n)\s*\.project__section\s*>\s*:is\(h2, h3\)/);
  assert.doesNotMatch(components, /(?:^|\n)\s*\.project__section\s*>\s*p:not\(\[class\]\)/);
  assert.doesNotMatch(components, /(?:^|\n)\.section-copy(?:\s|__|\{|\.)/);
  assert.doesNotMatch(components, /(?:^|\n)\.text-lead\s*\{/);

  assert.match(
    components,
    /\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child\s*\{/,
  );
});

test("index no longer carries late project shell typography patches", () => {
  const withoutImport = index.replace(/@import "\.\/project-shell\.css" layer\(components\);\n?/, "");
  for (const pattern of [
    /\.project__title\s*\{/,
    /\.project__summary\s*\{/,
    /\.project__lead\s*,/,
    /\.text-lead\s*\{/,
    /\.section-copy__title\s*\{/,
    /\.section-copy__text\s*\{/,
  ]) {
    assert.doesNotMatch(withoutImport, pattern);
  }
  assert.doesNotMatch(withoutImport, /\.project__section\s*>\s*:is\(h2, h3\)/);
  assert.doesNotMatch(withoutImport, /\.project__section\s*>\s*p:not\(\[class\]\)/);
});

test("canonical project shell preserves responsive order and final typography contracts", () => {
  assert.equal(existsSync(ownerPath), true, "project-shell.css must exist");
  if (!existsSync(ownerPath)) return;

  const owner = readFileSync(ownerPath, "utf8");
  const base = owner.indexOf("/* ==================================================\n   Project shell and typography");
  const project = owner.indexOf(".project {", base);
  const intro = owner.indexOf(".project__intro {", project);
  const wide = owner.indexOf("@container project (width > 50rem)", intro);
  const sectionCopy = owner.indexOf(".section-copy {", wide);

  assert.ok(base >= 0, "missing project-shell family marker");
  assert.ok(project > base, "project base must follow the family marker");
  assert.ok(intro > project, "project intro must follow project base");
  assert.ok(wide > intro, "wide project-shell rules must follow base rules");
  assert.ok(sectionCopy > wide, "section-copy contract must follow project responsive rules");

  assert.match(
    owner,
    /\.project__title\s*\{[\s\S]*?line-height:\s*var\(--lh-display\);[\s\S]*?letter-spacing:\s*var\(--ls-heading\);/,
  );
  assert.match(
    owner,
    /\.project__summary\s*\{[\s\S]*?line-height:\s*1\.38;[\s\S]*?letter-spacing:\s*var\(--ls-copy\);/,
  );
  assert.match(
    owner,
    /\.project__lead,\n\.text-lead\s*\{[\s\S]*?max-inline-size:\s*36ch;[\s\S]*?line-height:\s*var\(--lh-tight\);[\s\S]*?letter-spacing:\s*var\(--ls-tight\);/,
  );
  assert.match(
    owner,
    /\.section-copy__title\s*\{[\s\S]*?line-height:\s*var\(--lh-heading\);[\s\S]*?letter-spacing:\s*var\(--ls-display\);/,
  );
  assert.match(
    owner,
    /\.section-copy__text\s*\{[\s\S]*?line-height:\s*var\(--lh-copy\);[\s\S]*?letter-spacing:\s*var\(--ls-copy\);/,
  );
  assert.match(
    owner,
    /\.project__section > :is\(h2, h3\),\n\.project__section > section > :is\(h2, h3\)\s*\{[\s\S]*?line-height:\s*var\(--lh-heading\);[\s\S]*?letter-spacing:\s*var\(--ls-heading\);/,
  );
  assert.match(
    owner,
    /\.project__section > p:not\(\[class\]\),\n\.project__section > section > p:not\(\[class\]\)\s*\{[\s\S]*?line-height:\s*var\(--lh-copy\);[\s\S]*?letter-spacing:\s*var\(--ls-copy\);/,
  );

  assert.match(owner, /\.project\s*>\s*:is\(\.media, \.slider\)/);
  assert.match(owner, /@container project-section \(width > 45rem\)/);

  assert.doesNotMatch(owner, /(?:^|\n)\.group-note\b/);
  assert.doesNotMatch(owner, /(?:^|\n)\.editorial-note\b/);
  assert.doesNotMatch(owner, /(?:^|\n)\.credits\b/);
  assert.doesNotMatch(owner, /(?:^|\n)\.divider\b/);
  assert.doesNotMatch(
    owner,
    /\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child\s*\{/,
  );
});

test("project sections do not clobber specialized media-group container ownership", () => {
  const owner = readFileSync(ownerPath, "utf8");
  const media = readFileSync(mediaPath, "utf8");
  const loadedMediaContract = `${media}\n${components}`;

  assert.match(
    loadedMediaContract,
    /\.media-group\s*\{[\s\S]*?container:\s*media-group\s*\/\s*inline-size;/,
    "media-group must remain the named container owner for media-group queries regardless of physical stylesheet",
  );
  assert.doesNotMatch(
    owner,
    /\.project__section\s*\{[^}]*container:\s*project-section\s*\/\s*inline-size;/,
    "the generic project-section block must not overwrite a specialized media-group container name",
  );
  assert.match(
    owner,
    /\.project__section:not\(\.media-group\)\s*\{\s*container:\s*project-section\s*\/\s*inline-size;\s*\}/,
    "non-media project sections must keep the project-section container contract",
  );
});
