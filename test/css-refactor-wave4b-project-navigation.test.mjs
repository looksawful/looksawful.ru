import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const componentsPath = new URL("../src/styles/components.css", import.meta.url);
const indexPath = new URL("../src/styles/index.css", import.meta.url);
const ownerPath = new URL("../src/styles/project-navigation.css", import.meta.url);
const legacyTopPath = new URL("../src/styles/project-navigation-top.css", import.meta.url);

const components = readFileSync(componentsPath, "utf8");
const index = readFileSync(indexPath, "utf8");

test("project navigation has one canonical stylesheet owner at the existing import slot", () => {
  assert.equal(existsSync(ownerPath), true, "project-navigation.css must exist");
  assert.equal(existsSync(legacyTopPath), false, "project-navigation-top.css must be retired after consolidation");
  assert.match(
    index,
    /@import "\.\/project-header\.css" layer\(components\);\n@import "\.\/project-navigation\.css" layer\(components\);\n@import "\.\/expertise\.css" layer\(components\);/,
  );
  assert.doesNotMatch(index, /project-navigation-top\.css/);
});

test("components aggregate no longer owns project navigation presentation", () => {
  assert.doesNotMatch(components, /(?:^|\n)\.project-nav(?:\s|__|\[|\{|\.)/);
  assert.doesNotMatch(components, /(?:^|\n)\[data-navigation-project\]\s*\{/);
});

test("canonical owner preserves base-before-extension cascade order", () => {
  assert.equal(existsSync(ownerPath), true, "project-navigation.css must exist");
  const owner = readFileSync(ownerPath, "utf8");

  const base = owner.indexOf(".project-nav {");
  const baseInner = owner.indexOf(".project-nav__inner {", base + 1);
  const top = owner.indexOf(".project-nav__top {");
  const safeArea = owner.indexOf("env(safe-area-inset-bottom, 0px)");

  assert.notEqual(base, -1, "canonical owner must contain project-nav base");
  assert.notEqual(baseInner, -1, "canonical owner must contain base inner layout");
  assert.notEqual(top, -1, "canonical owner must contain top-link extension");
  assert.notEqual(safeArea, -1, "canonical owner must preserve compact safe-area padding");
  assert.ok(base < top, "base project navigation rules must stay before top-link extension rules");
  assert.ok(baseInner < top, "base inner layout must stay before its top-link override");

  assert.match(owner, /@container projects \(width > 96rem\)/);
  assert.match(owner, /@supports \(scroll-target-group: auto\)/);
  assert.match(owner, /@supports selector\(:target-current\)/);
  assert.match(owner, /\.project-nav__top-label/);
});
