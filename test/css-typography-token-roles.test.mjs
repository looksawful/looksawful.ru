import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const tokens = read("../src/styles/tokens.css");
const components = read("../src/styles/components.css");
const captions = read("../src/styles/captions.css");
const projectNavigation = read("../src/styles/project-navigation.css");
const expertise = read("../src/styles/expertise.css");

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

test("supporting interface size has one token owner across the accepted CSS owners", () => {
  const tokenDefinition =
    /--fs-supporting:\s*clamp\(0\.72rem,\s*0\.68rem \+ 0\.15cqi,\s*0\.84rem\);/;
  const tokenUse = /font-size:\s*var\(--fs-supporting\);/;
  const duplicatedLiteral =
    /font-size:\s*clamp\(0\.72rem,\s*0\.68rem \+ 0\.15cqi,\s*0\.84rem\);/;

  assert.match(tokens, tokenDefinition);

  const owners = [components, captions, projectNavigation];

  for (const css of owners) {
    assert.match(css, tokenUse);
    assert.doesNotMatch(css, duplicatedLiteral);
  }
});
