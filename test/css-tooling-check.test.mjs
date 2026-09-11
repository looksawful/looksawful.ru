import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
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

const canonicalManifest = `@layer reset, tokens, colors, base, patterns, components, captions, motion, utilities;

@import "@fontsource-variable/inter/wght.css";

@import "./reset.css" layer(reset);
@import "./tokens.css" layer(tokens);
@import "./colors.css" layer(colors);
@import "./base.css" layer(base);
@import "./patterns.css" layer(patterns);
@import "./media.css" layer(components);
@import "./components.css" layer(components);
@import "./before-after.css" layer(components);
@import "./code-block.css" layer(components);
@import "./project-header.css" layer(components);
@import "./project-navigation.css" layer(components);
@import "./project-shell.css" layer(components);
@import "./expertise.css" layer(components);
@import "./experience.css" layer(components);
@import "./site-navigation.css" layer(components);
@import "./page-flip.css" layer(components);
@import "./slider.css" layer(components);
@import "./media-deck.css" layer(components);
@import "./media-lightbox.css" layer(components);
@import "../components/jestei-theme-organism/jestei-theme-organism.css";
@import "./captions.css" layer(captions);
@import "./motion.css" layer(motion);
@import "./utilities.css" layer(utilities);
`;

function checkFixture(indexSource) {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "looksawful-css-check-"));
  try {
    const styles = path.join(fixtureRoot, "src/styles");
    mkdirSync(styles, { recursive: true });
    writeFileSync(path.join(styles, "index.css"), indexSource);
    return checkCssArchitecture(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

test("css:check is wired as a small repository-owned architecture command", () => {
  assert.equal(packageJson.scripts["css:check"], "node tools/css/check.mjs");
  assert.deepEqual(checkCssArchitecture(root), []);
});

test("manifest checker enforces the complete ordered stylesheet load graph", () => {
  assert.deepEqual(checkFixture(canonicalManifest), []);

  const withoutMedia = canonicalManifest.replace(
    '@import "./media.css" layer(components);\n',
    "",
  );
  assert.match(checkFixture(withoutMedia).join("\n"), /manifest:/);

  const reordered = canonicalManifest
    .replace('@import "./project-shell.css" layer(components);\n', "")
    .replace(
      '@import "./expertise.css" layer(components);\n',
      '@import "./expertise.css" layer(components);\n@import "./project-shell.css" layer(components);\n',
    );
  assert.match(checkFixture(reordered).join("\n"), /manifest:/);
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

test("owner registry protects stabilized project, expertise, experience and media internals", () => {
  const regrowth = new Map([
    [
      "src/styles/unrelated.css",
      `.project__intro { display: grid; }
.expertise__item { display: grid; }
.experience__period { display: block; }
.media-group__head { display: grid; }`,
    ],
  ]);
  const errors = findOwnerViolations(regrowth);
  assert.equal(errors.length, 4, errors.join("\n"));
  assert.match(errors.join("\n"), /src\/styles\/project-shell\.css/);
  assert.match(errors.join("\n"), /src\/styles\/expertise\.css/);
  assert.match(errors.join("\n"), /src\/styles\/experience\.css/);
  assert.match(errors.join("\n"), /src\/styles\/media\.css/);

  const allowedComposition = new Map([
    [
      "src/styles/components.css",
      `.expertise { padding-block: 1rem; }
.experience { padding-block: 1rem; }
.project__section > :is(.media, .mockup, .slider):only-child { inline-size: 100%; }`,
    ],
    [
      "src/styles/index.css",
      `.media-group[data-layout="strip"] .portfolio-logo-wall__item .media__surface { isolation: isolate; }`,
    ],
  ]);
  assert.deepEqual(findOwnerViolations(allowedComposition), []);
});

test("components residual guard freezes durable family growth without banning composition seams", () => {
  const components = readFileSync(
    new URL("../src/styles/components.css", import.meta.url),
    "utf8",
  );
  assert.deepEqual(findComponentsNoGrowthViolations(components), []);

  assert.deepEqual(
    findComponentsNoGrowthViolations(".hero { display: grid; }"),
    [],
    "retiring existing residual families must remain legal",
  );
  assert.deepEqual(
    findComponentsNoGrowthViolations(
      `.project__section > :is(.media, .mockup, .slider):only-child { inline-size: 100%; }
.project__footer { display: flex; }
.media__surface { overflow: hidden; }
.slider__slide { display: grid; }
.expertise { padding: 1rem; }
.experience { padding: 1rem; }`,
    ),
    [],
    "documented composition/residual seams must remain legal",
  );
  assert.deepEqual(
    findComponentsNoGrowthViolations(
      `.hero { display: grid; }
.new-widget__part { display: block; }`,
    ),
    [
      "components: new durable selector family .new-widget is not in the residual allowlist",
    ],
  );
  assert.deepEqual(
    findComponentsNoGrowthViolations(
      `.hero { display: grid; }
.media__new-internal { display: block; }`,
    ),
    [
      "components: selector .media__new-internal is not an allowed composition seam",
    ],
    "one allowed media seam must not grant the whole media owner family",
  );
  assert.deepEqual(
    findComponentsNoGrowthViolations(
      `.hero { display: grid; }
.project__new-internal { display: block; }`,
    ),
    [
      "components: selector .project__new-internal is not an allowed composition seam",
    ],
    "one deferred project seam must not grant the whole project owner family",
  );
  assert.deepEqual(
    findComponentsNoGrowthViolations(
      `.hero::before { content: ".new-widget__not-a-selector"; }`,
    ),
    [],
    "quoted content must not be mistaken for a selector family",
  );
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

test("owner checker allows the documented captions-layer slider seam only", () => {
  const seam = `.slider[data-media-deck] [data-slide-caption]:not([data-caption-view="full"]) { display: none; }`;
  const allowed = new Map([["src/styles/captions.css", seam]]);
  assert.deepEqual(findOwnerViolations(allowed), []);

  const staleIndex = new Map([["src/styles/index.css", seam]]);
  assert.deepEqual(findOwnerViolations(staleIndex), [
    "slider: selector family belongs to src/styles/slider.css, found in src/styles/index.css",
  ]);

  const regrowth = new Map([
    ["src/styles/captions.css", `${seam}\n.slider { padding: 1rem; }`],
  ]);
  assert.deepEqual(findOwnerViolations(regrowth), [
    "slider: selector family belongs to src/styles/slider.css, found in src/styles/captions.css",
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

test("index stylesheet does not own typography refinements", () => {
  const index = readFileSync(new URL("../src/styles/index.css", import.meta.url), "utf8");
  const typographyDeclarations =
    index.match(/^[ \t]*(?:font(?:-[\w-]+)?|line-height|letter-spacing)\s*:/gm) ?? [];

  assert.deepEqual(
    typographyDeclarations,
    [],
    "typography declarations belong to canonical selector owners, not index.css",
  );
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
