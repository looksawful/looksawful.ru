import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  checkCssArchitecture,
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

test("owner checker catches indented and grouped durable owner selectors", () => {
  const cases = [
    "@media (width > 1px) {\n  .slider { display: grid; }\n}",
    "@layer components {\n  .before-after { display: grid; }\n}",
    ".other, .page-flip { display: grid; }",
    ".other,\n  [data-media-deck] { display: grid; }",
    "@media (width > 1px) { .media-lightbox__layout { display: grid; } }",
  ];

  for (const source of cases) {
    const errors = findOwnerViolations(
      new Map([["src/styles/components.css", source]]),
    );
    assert.equal(errors.length, 1, source);
  }
});

test("owner checker preserves parent composition through functional pseudos", () => {
  const sources = new Map([
    [
      "src/styles/components.css",
      ".project__section > :is(.media, .mockup, .slider):only-child { inline-size: 100%; }",
    ],
    [
      "src/styles/project-shell.css",
      ".project > :is(.media, .slider) { margin-inline: auto; }",
    ],
  ]);

  assert.deepEqual(findOwnerViolations(sources), []);
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

test("incoming lifecycle accepts one fully described temporary family", () => {
  const source = `/* @incoming\n * issue: #590\n * target: component:example\n * reason: owner is not stable yet\n * exit: move to a durable owner before final regression\n */\n.example { display: grid; }`;

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
      source: `/* @incoming\n * issue: later\n * target: component:example\n * reason: owner is not stable yet\n * exit: move to a durable owner\n */\n.example { display: grid; }`,
      expected: "incoming: lifecycle header requires issue: #<number> metadata",
    },
    {
      source: `/* @incoming\n * issue: #590\n * reason: owner is not stable yet\n * exit: move to a durable owner\n */\n.example { display: grid; }`,
      expected: "incoming: lifecycle header requires non-empty target metadata",
    },
    {
      source: `/* @incoming\n * issue: #590\n * target: component:example\n * exit: move to a durable owner\n */\n.example { display: grid; }`,
      expected: "incoming: lifecycle header requires non-empty reason metadata",
    },
    {
      source: `/* @incoming\n * issue: #590\n * target: component:example\n * reason: owner is not stable yet\n */\n.example { display: grid; }`,
      expected: "incoming: lifecycle header requires non-empty exit metadata",
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
  const source = `/* @incoming\n * issue: #590\n * target: component:first\n * reason: first owner is not stable\n * exit: move first to a durable owner\n */\n.first { display: grid; }\n\n/* @incoming\n * issue: #591\n * target: component:second\n * reason: second owner is not stable\n * exit: move second to a durable owner\n */\n.second { display: grid; }`;

  assert.deepEqual(findIncomingLifecycleViolations(source), [
    "incoming: incoming.css allows exactly one @incoming lifecycle header",
  ]);
});
