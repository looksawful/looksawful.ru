import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const patterns = readFileSync(new URL("../src/styles/patterns.css", import.meta.url), "utf8");
const projectShell = readFileSync(new URL("../src/styles/project-shell.css", import.meta.url), "utf8");
const expertiseCss = readFileSync(new URL("../src/styles/expertise.css", import.meta.url), "utf8");
const sectionIntro = readFileSync(new URL("../src/templates/section-intro.ts", import.meta.url), "utf8");
const expertise = readFileSync(new URL("../src/components/expertise.ts", import.meta.url), "utf8");

test("text-pair owns the asymmetric intrinsic wrapping algorithm", () => {
  assert.match(patterns, /\.text-pair\s*\{[\s\S]*?--_text-pair-side-size:\s*var\(--text-pair-side-size,\s*auto\);[\s\S]*?--_text-pair-content-min:\s*var\(--text-pair-content-min,\s*50%\);[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*wrap;/);
  assert.match(patterns, /\.text-pair\s*>\s*:first-child\s*\{[\s\S]*?flex-basis:\s*var\(--_text-pair-side-size\);[\s\S]*?flex-grow:\s*1;[\s\S]*?flex-shrink:\s*0;/);
  assert.match(patterns, /\.text-pair\s*>\s*:last-child\s*\{[\s\S]*?flex-basis:\s*0;[\s\S]*?flex-grow:\s*999;[\s\S]*?min-inline-size:\s*var\(--_text-pair-content-min\);/);
  assert.match(patterns, /\.text-pair\s*>\s*:only-child\s*\{[\s\S]*?flex-basis:\s*100%;[\s\S]*?flex-shrink:\s*1;[\s\S]*?min-inline-size:\s*0;/);
});

test("section copy and expertise consume text-pair instead of hand-authored split rules", () => {
  assert.match(sectionIntro, /class="section-copy text-pair"/);
  assert.match(expertise, /class="expertise__head text-pair"/);
  assert.match(expertise, /class="expertise__copy"[\s\S]*?class="expertise__description"/);
  assert.doesNotMatch(projectShell, /@container project-section \(width > 45rem\)[\s\S]*?\.section-copy\s*\{/);
  const titleDeclarations = projectShell.match(/\.section-copy__title\s*\{([^}]*)\}/)?.[1];
  assert.ok(titleDeclarations, "section-copy title styles must exist");
  assert.doesNotMatch(titleDeclarations, /max-inline-size:/);
  assert.match(projectShell, /\.section-copy__text\s*>\s*\*\s*\{[\s\S]*?max-inline-size:\s*var\(--project-copy-max\);/);
  const expertiseHeadDeclarations = expertiseCss.match(/\.expertise__head\s*\{([^}]*)\}/)?.[1];
  assert.ok(expertiseHeadDeclarations, "expertise text-pair styles must exist");
  assert.doesNotMatch(expertiseHeadDeclarations, /grid-template-columns:/);
});


test("expertise restores space-between alignment between titles and copy", () => {
  assert.match(
    expertiseCss,
    /\.expertise__head\s*\{[\s\S]*?justify-content:\s*space-between;/,
  );
  assert.match(
    expertiseCss,
    /\.expertise__head\s*>\s*:first-child\s*\{[\s\S]*?flex-grow:\s*0;/,
  );
  const lastChildDeclarations = expertiseCss.match(/\.expertise__head\s*>\s*:last-child\s*\{([^}]*)\}/)?.[1];
  assert.ok(lastChildDeclarations, "expertise layout must have a content owner");
  assert.match(lastChildDeclarations, /flex-grow:\s*0;/);
  assert.match(lastChildDeclarations, /flex-basis:\s*min\(62\.5%,\s*62ch\);/);
});
