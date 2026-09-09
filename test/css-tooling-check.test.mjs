import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  checkCssArchitecture,
  findOwnerViolations,
} from "../tools/css/check.mjs";

const root = new URL("../", import.meta.url);
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

test("css:check is wired as a small repository-owned architecture command", () => {
  assert.equal(packageJson.scripts["css:check"], "node tools/css/check.mjs");
  assert.deepEqual(checkCssArchitecture(root), []);
});

test("owner checker catches selector family regrowth outside its canonical owner", () => {
  const sources = new Map([
    ["src/styles/site-navigation.css", ".site-nav { display: grid; }"],
    ["src/styles/components.css", ".site-nav__menu { display: block; }"],
  ]);

  const errors = findOwnerViolations(sources, [
    {
      name: "site-navigation",
      owner: "src/styles/site-navigation.css",
      patterns: [/\.site-nav(?:__[\w-]+)?(?=[\s,{.:#>\[])/],
    },
  ]);

  assert.deepEqual(errors, [
    "site-navigation: selector family belongs to src/styles/site-navigation.css, found in src/styles/components.css",
  ]);
});

test("owner checker does not confuse related but different class families", () => {
  const sources = new Map([
    ["src/styles/code-block.css", ".code-block { display: grid; }"],
    ["src/styles/components.css", ".code-block-grid { display: grid; }"],
  ]);

  const errors = findOwnerViolations(sources, [
    {
      name: "code-block",
      owner: "src/styles/code-block.css",
      patterns: [/\.code-block(?:__[\w-]+)?(?=[\s,{.:#>\[])/],
    },
  ]);

  assert.deepEqual(errors, []);
});
