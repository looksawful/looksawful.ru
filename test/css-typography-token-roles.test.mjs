import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const tokens = read("../src/styles/tokens.css");
const components = read("../src/styles/components.css");
const captions = read("../src/styles/captions.css");
const projectNavigation = read("../src/styles/project-navigation.css");
const expertise = read("../src/styles/expertise.css");
const utilities = read("../src/styles/utilities.css");

test("canonical typography roles consume semantic line-height and spacing tokens", () => {
  assert.match(
    components,
    /\.hero[\s\S]*?& h1\s*\{[\s\S]*?line-height:\s*var\(--lh-hero\);[\s\S]*?letter-spacing:\s*var\(--ls-hero\);/,
  );
  assert.match(
    components,
    /& > footer > p\s*\{[\s\S]*?line-height:\s*var\(--lh-tight\);[\s\S]*?letter-spacing:\s*var\(--ls-lead\);/,
  );
  assert.match(captions, /\.media__caption\s*\{[\s\S]*?line-height:\s*var\(--lh-caption\);/);
  assert.match(
    projectNavigation,
    /\.project-nav__link\s*\{[\s\S]*?line-height:\s*var\(--lh-caption\);/,
  );
  assert.match(
    projectNavigation,
    /\.project-nav__top\s*\{[\s\S]*?line-height:\s*var\(--lh-caption\);/,
  );
  assert.match(expertise, /\.expertise__description\s*\{[\s\S]*?line-height:\s*var\(--lh-body\);/);
});

test("supporting interface copy shares one Inter-era size role without absorbing placeholders", () => {
  assert.match(
    tokens,
    /--fs-supporting:\s*clamp\(0\.72rem,\s*0\.68rem \+ 0\.15cqi,\s*0\.84rem\);/,
  );

  assert.match(
    captions,
    /\.media__caption\s*\{[^}]*?font-size:\s*var\(--fs-supporting\);[^}]*?line-height:\s*var\(--lh-caption\);/,
  );
  assert.match(
    projectNavigation,
    /\.project-nav__link\s*\{[^}]*?font-size:\s*var\(--fs-supporting\);[^}]*?line-height:\s*var\(--lh-caption\);/,
  );
  assert.match(
    projectNavigation,
    /\.project-nav__top\s*\{[^}]*?font-size:\s*var\(--fs-supporting\);[^}]*?line-height:\s*var\(--lh-caption\);/,
  );
  assert.match(
    components,
    /\.project-card__caption\s*\{[^}]*?font-size:\s*var\(--fs-supporting\);[^}]*?line-height:\s*var\(--lh-caption\);/,
  );
  assert.match(
    components,
    /\.brand-system__hover-copy\s*\{[^}]*?font-size:\s*var\(--fs-supporting\);[^}]*?line-height:\s*var\(--lh-caption\);/,
  );
  assert.match(
    components,
    /\.jestei-captioned-group \.jestei-media__hover-copy\s*\{[^}]*?font-size:\s*var\(--fs-supporting\);[^}]*?line-height:\s*var\(--lh-caption\);/,
  );

  assert.match(
    utilities,
    /\.placeholder-surface\s*\{[^}]*?font-size:\s*clamp\(0\.72rem,\s*0\.68rem \+ 0\.15cqi,\s*0\.84rem\);/,
  );
});
