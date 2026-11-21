import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { canonicalFoundationGroup, isCanonicalFoundationDeclaration } from "../src/lab/token-visualization.mjs";
import foundations from "../src/lab/stories/foundations.stories.mjs";
import references from "../src/lab/stories/foundations-reference.stories.mjs";
import { referenceTokens } from "../src/lab/foundations-reference-data.mjs";

test("all active root tokens belong to exactly one Foundations group", () => {
  const tokens = ["tokens.css", "colors.css"].flatMap((file) => {
    const css = readFileSync(new URL(`../src/styles/${file}`, import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    return [...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]);
  });
  assert.equal(new Set(tokens).size, tokens.length);
  const groups = new Set(tokens.map((name) => {
    assert.equal(isCanonicalFoundationDeclaration({ name, selector: ":root" }), true, name);
    return canonicalFoundationGroup(name);
  }));
  assert.deepEqual(groups, new Set(["palette", "typography", "spacing", "shape", "motion"]));
  assert.equal(isCanonicalFoundationDeclaration({ name: "--clr-accent", selector: ".local" }), false);
});

test("reference values remain separate from production Foundations", () => {
  assert.equal(foundations.title, "00 Foundations/Design Tokens");
  assert.equal(references.title, "90 Experimental/Extracted Reference Tokens");
  assert.equal(references.parameters.looksawful.canonical, false);
  assert.equal(referenceTokens.length, 38);
});
