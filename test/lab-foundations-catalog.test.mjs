import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { classifyToken, isCanonicalFoundationDeclaration } from "../src/lab/token-visualization.mjs";
import foundations, {
  FontFamilies, FontWeights, TypeScale, LineHeights, LetterSpacing,
  SemanticColors, SurfaceColors, BorderWidths, RadiusScale, Shadows,
  SpacingScale, ContentWidths, MotionSpeeds, Layers, ControlGeometry,
} from "../src/lab/stories/foundations.stories.mjs";
import reference, {
  ExtractedColors, ExtractedTypography, ExtractedSpacing, ExtractedEffects,
} from "../src/lab/stories/foundations-reference.stories.mjs";
import { referenceTokens } from "../src/lab/foundations-reference-data.mjs";

const canonicalNames = [
  ["--ff-primary", "font-family"],
  ["--ff-mono", "font-family"],
  ["--fw-700", "font-weight"],
  ["--fs-300", "font-size"],
  ["--lh-body", "line-height"],
  ["--ls-display", "letter-spacing"],
  ["--size-400", "spacing"],
  ["--space-caption", "spacing"],
  ["--content-max-width", "spacing"],
  ["--page-padding-inline", "spacing"],
  ["--radius-editorial", "radius"],
  ["--shadow-control", "shadow"],
  ["--border-width-100", "border"],
  ["--motion-speed-autoscroll", "speed"],
  ["--layer-contact-hub", "z-index"],
];

test("real production foundation prefixes are classified as useful token types", () => {
  for (const [name, kind] of canonicalNames) {
    assert.equal(classifyToken(name, "var(--sample)"), kind, name);
  }
});

test("canonical foundation source filter rejects component-local and commented theme data", () => {
  assert.equal(isCanonicalFoundationDeclaration({name:"--ff-primary",selector:":root"}), true);
  assert.equal(isCanonicalFoundationDeclaration({name:"--clr-accent",selector:":where(:root, [data-theme])"}), true);
  assert.equal(isCanonicalFoundationDeclaration({name:"--clr-accent",selector:"[data-theme=blue]"}), false);
  assert.equal(isCanonicalFoundationDeclaration({name:"--size-100",selector:".project-card"}), false);
  assert.equal(isCanonicalFoundationDeclaration({name:"--arbitrary-var",selector:":root"}), false);
});

test("canonical foundations are browseable in Storybook without rendering organisms", () => {
  assert.equal(foundations.title, "00 Foundations/Tokens");
  for (const [name, story] of Object.entries({
    FontFamilies, FontWeights, TypeScale, LineHeights, LetterSpacing,
    SemanticColors, SurfaceColors, BorderWidths, RadiusScale, Shadows,
    SpacingScale, ContentWidths, MotionSpeeds, Layers, ControlGeometry, ControlGeometry,
  })) {
    assert.equal(typeof story.render, "function", name);
  }
  assert.equal(reference.title, "00 Foundations/Extracted Reference Tokens");
  assert.equal(reference.parameters.looksawful.canonical, false);
  for (const story of [ExtractedColors, ExtractedTypography, ExtractedSpacing, ExtractedEffects]) {
    assert.equal(typeof story.render, "function");
  }
});

test("user's 38 extracted reference tokens are complete and strictly noncanonical", () => {
  assert.equal(referenceTokens.length, 38);
  const groups = {color:18,text:6,space:7,radius:3,shadow:4};
  for (const [prefix,total] of Object.entries(groups)) {
    const group=referenceTokens.filter(t=>t.name.startsWith("--"+prefix+"-"));
    assert.equal(group.length,total,prefix);
  }
  assert.equal(referenceTokens.find(t=>t.name==="--color-5")?.value,"#2f5bff");
  assert.equal(referenceTokens.find(t=>t.name==="--text-1")?.value,"8.8rem");
  assert.equal(referenceTokens.find(t=>t.name==="--shadow-1")?.value,"var(--shadow-surface-elevated)");
  const original = readFileSync(new URL("../src/styles/tokens.css",import.meta.url),"utf8");
  assert.doesNotMatch(original,/--color-1:/);
  assert.match(original,/--ff-primary:/);
});

test("active palette is not confused with the 24 commented-out theme presets", () => {
  const css=readFileSync(new URL("../src/styles/colors.css",import.meta.url),"utf8");
  const active=css.replace(/\/\*[\s\S]*?\*\//g,"");
  assert.doesNotMatch(active,/\[data-theme="(?:black-white|pink-red|neutral)"\]/);
  assert.match(active,/--clr-accent:/);
});

test("reference file exports only real story definitions (no blank ghost story)", async () => {
  const exports = Object.keys(await import("../src/lab/stories/foundations-reference.stories.mjs")).sort();
  assert.deepEqual(exports, ["ExtractedColors", "ExtractedEffects", "ExtractedSpacing", "ExtractedTypography", "default"].sort());
});

test("every active production global token has a recognized family", () => {
  const core=readFileSync(new URL("../src/styles/tokens.css",import.meta.url),"utf8");
  const colors=readFileSync(new URL("../src/styles/colors.css",import.meta.url),"utf8")
    .replace(/\/\*[\s\S]*?\*\//g,"");
  const extract=(css)=>[...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m=>m[1]);
  const all=[...extract(core),...extract(colors)];
  assert.equal(all.length,82);
  assert.equal(new Set(all).size,82);
  for(const name of all){
    assert.equal(isCanonicalFoundationDeclaration({name,selector:":root"}),true,name);
    assert.notEqual(classifyToken(name,"var(--sample)"),"other",name);
  }
});
