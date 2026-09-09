import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  checkCssArchitecture,
  findComponentsNoGrowthViolations,
  findIncomingLifecycleViolations,
  findOwnerViolations,
} from "../tools/css/check.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
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

test("components residual guard allows retirement but rejects a new selector family", () => {
  const allowedFamilies = new Set(["hero", "project-card"]);

  assert.deepEqual(
    findComponentsNoGrowthViolations(
      ".hero__portrait { display: block; }\n.project-card__media { display: grid; }",
      allowedFamilies,
    ),
    [],
  );

  assert.deepEqual(
    findComponentsNoGrowthViolations(
      ".hero { display: block; }\n.new-widget { display: grid; }",
      allowedFamilies,
    ),
    ["components: new durable selector family .new-widget is not in the residual allowlist"],
  );

  assert.deepEqual(
    findComponentsNoGrowthViolations(".hero { display: block; }", allowedFamilies),
    [],
  );
});

test("incoming lifecycle accepts one fully described temporary family", () => {
  const source = `/* @incoming\n * issue: #590\n * target: component:example\n * reason: owner is not stable yet\n */\n.example { display: grid; }`;

  assert.deepEqual(findIncomingLifecycleViolations(source), []);
});

test("incoming lifecycle rejects missing or malformed required metadata", () => {
  const cases = [
    {
      source: ".example { display: grid; }",
      expected:
        "incoming: non-empty incoming.css requires @incoming lifecycle metadata",
    },
    {
      source: `/* @incoming\n * issue: later\n * target: component:example\n * reason: owner is not stable yet\n */\n.example { display: grid; }`,
      expected: "incoming: lifecycle header requires issue: #<number> metadata",
    },
    {
      source: `/* @incoming\n * issue: #590\n * reason: owner is not stable yet\n */\n.example { display: grid; }`,
      expected: "incoming: lifecycle header requires non-empty target metadata",
    },
    {
      source: `/* @incoming\n * issue: #590\n * target: component:example\n */\n.example { display: grid; }`,
      expected: "incoming: lifecycle header requires non-empty reason metadata",
    },
    {
      source: `@incoming;\n.example { display: grid; }`,
      expected:
        "incoming: @incoming lifecycle metadata must be inside a CSS comment",
    },
  ];

  for (const { source, expected } of cases) {
    assert.deepEqual(findIncomingLifecycleViolations(source), [expected]);
  }
});

test("incoming lifecycle is a single-slot quarantine", () => {
  const source = `/* @incoming\n * issue: #590\n * target: component:first\n * reason: first owner is not stable\n */\n.first { display: grid; }\n\n/* @incoming\n * issue: #591\n * target: component:second\n * reason: second owner is not stable\n */\n.second { display: grid; }`;

  assert.deepEqual(findIncomingLifecycleViolations(source), [
    "incoming: incoming.css allows exactly one @incoming lifecycle header",
  ]);
});
