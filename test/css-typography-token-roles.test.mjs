import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const captions = readFileSync(new URL("../src/styles/captions.css", import.meta.url), "utf8");
const projectNavigation = readFileSync(new URL("../src/styles/project-navigation.css", import.meta.url), "utf8");
const expertise = readFileSync(new URL("../src/styles/expertise.css", import.meta.url), "utf8");

test("canonical typography roles consume semantic line-height and spacing tokens", () => {
  assert.match(components, /\.hero[\s\S]*?& h1\s*\{[\s\S]*?line-height:\s*var\(--lh-hero\);[\s\S]*?letter-spacing:\s*var\(--ls-hero\);/);
  assert.match(components, /& > footer > p\s*\{[\s\S]*?line-height:\s*var\(--lh-tight\);[\s\S]*?letter-spacing:\s*var\(--ls-lead\);/);
  assert.match(captions, /\.media__caption\s*\{[\s\S]*?line-height:\s*var\(--lh-caption\);/);
  assert.match(projectNavigation, /\.project-nav__link\s*\{[\s\S]*?line-height:\s*var\(--lh-caption\);/);\n  assert.match(projectNavigation, /\.project-nav__top\s*\{[\s\S]*?line-height:\s*var\(--lh-caption\);/);
  assert.match(expertise, /\.expertise__description\s*\{[\s\S]*?line-height:\s*var\(--lh-body\);/);
});

test("supporting interface copy shares one current Inter-era size token", () => {
  const tokens = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");

  assert.match(
    tokens,
    /--fs-supporting:\s*clamp\(0\.72rem,\s*0\.68rem \+ 0\.15cqi,\s*0\.84rem\);/,
  );
  assert.match(
    captions,
    /\.media__caption\s*\{[\s\S]*?font-size:\s*var\(--fs-supporting\);/,
  );
  assert.match(
    projectNavigation,
    /\.project-nav__link\s*\{[\s\S]*?font-size:\s*var\(--fs-supporting\);/,
  );
  assert.match(
    projectNavigation,
    /\.project-nav__top\s*\{[\s\S]*?font-size:\s*var\(--fs-supporting\);/,
  );
  assert.match(
    components,
    /\.project-card__caption\s*\{[\s\S]*?font-size:\s*var\(--fs-supporting\);/,
  );
  assert.match(
    components,
    /\.brand-system__hover-copy\s*\{[\s\S]*?font-size:\s*var\(--fs-supporting\);/,
  );
  assert.match(
    components,
    /\.jestei-captioned-group[\s\S]*?\.jestei-media__hover-copy\s*\{[\s\S]*?font-size:\s*var\(--fs-supporting\);/,
  );
});

