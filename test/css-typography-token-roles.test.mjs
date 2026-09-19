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
  assert.match(projectNavigation, /\.project-nav__(?:item|top)[\s\S]*?line-height:\s*var\(--lh-caption\);/);
  assert.match(expertise, /\.expertise__description\s*\{[\s\S]*?line-height:\s*var\(--lh-body\);/);
});
