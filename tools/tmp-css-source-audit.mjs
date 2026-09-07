import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const BASELINE = "113232f654a8f7f79ed9dba64e7b8774487e9099";
const TEST491 = "72751d54d4228e7ff301d430c9699077741422b0";
const REMEDIATION495 = "910c9dd388521607c457712d829be52d6a71bd56";
const CURRENT = "dc45129e08389107a05aa3a960bd94d6a3a7d511";
const WAVE5 = "5ca5b931fa9c344df1581a0bf8e7e43d84fac284";

const merges = Object.freeze({
  wave1: "d9b22ebb3cb0d1ca403a6d71985ea1a8b2962cb0",
  wave2a: "e418db814f4493607b34f21491d5606e53980cfe",
  wave3: "3b0ded9485c4a9b3f56783966a9b27cff8faac05",
  wave4a: "a89980412bf924b558c3aee91d5ee6bc7d171006",
  wave4b: "a8df2a662875215dce6aff53f3256e4b553935f7",
  wave4c: "ed25f48574d5bb13e9c26168dd0eb88a1ddc14ee",
  wave4d: "a40b3ed56e32a6586818e8069819c86b0d92c209",
  test491: TEST491,
  remediation495: REMEDIATION495,
});

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, ...options });
}

function show(ref, path) {
  return git(["show", `${ref}:${path}`]);
}

function exists(ref, path) {
  try {
    git(["cat-file", "-e", `${ref}:${path}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function parent(ref) {
  return git(["rev-parse", `${ref}^1`]).trim();
}

function changed(base, head) {
  return git(["diff", "--name-only", base, head]).trim().split("\n").filter(Boolean).sort();
}

function numstat(base, head, path) {
  const line = git(["diff", "--numstat", base, head, "--", path]).trim();
  const [additions, deletions] = line.split(/\s+/).map(Number);
  return { additions, deletions };
}

function normalize(source) {
  return source.replaceAll("\r\n", "\n").trim();
}

function between(source, startMarker, endMarker, from = 0) {
  const start = source.indexOf(startMarker, from);
  assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

function braceBlock(source, marker, from = 0) {
  const start = source.indexOf(marker, from);
  assert.notEqual(start, -1, `missing block marker: ${marker}`);
  const open = source.indexOf("{", start);
  assert.notEqual(open, -1, `missing opening brace after: ${marker}`);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated block: ${marker}`);
}

function assertFiles(base, head, expected, label) {
  assert.deepEqual(changed(base, head), [...expected].sort(), `${label}: changed-file set drift`);
}

function assertContainsExact(haystack, needle, label) {
  assert.ok(normalize(haystack).includes(normalize(needle)), `${label}: original source block is not preserved`);
}

const results = [];
function audit(name, fn) {
  fn();
  results.push(name);
  console.log(`PASS ${name}`);
}

audit("Wave 1 is test infrastructure only", () => {
  const merge = merges.wave1;
  const before = parent(merge);
  assert.equal(before, BASELINE);
  assertFiles(before, merge, ["test/helpers/style-owner.mjs", "test/site-navigation-style.test.mjs"], "Wave 1");
  assert.ok(changed(before, merge).every((path) => path.startsWith("test/")));
});

audit("Wave 2A deletes only audited legacy Expertise/Experience CSS", () => {
  const merge = merges.wave2a;
  const before = parent(merge);
  assertFiles(before, merge, ["src/styles/components.css", "test/css-refactor-wave2a.test.mjs"], "Wave 2A");
  assert.deepEqual(numstat(before, merge, "src/styles/components.css"), { additions: 0, deletions: 103 });
  assert.equal(show(before, "src/styles/expertise.css"), show(merge, "src/styles/expertise.css"));
  assert.equal(show(before, "src/styles/experience.css"), show(merge, "src/styles/experience.css"));
  const after = show(merge, "src/styles/components.css");
  assert.doesNotMatch(after, /\.expertise\s*\{\s*& ol\s*\{/s);
  assert.doesNotMatch(after, /\.experience\s*\{\s*& ol\s*\{/s);
  assert.match(after, /\.expertise,\s*\.experience,\s*\.projects-grid,\s*\.portfolio-showcase,\s*\.tools\s*\{/);
});

audit("Wave 3 code-block is an exact contiguous move", () => {
  const merge = merges.wave3;
  const before = parent(merge);
  const aggregate = show(before, "src/styles/components.css");
  const moved = between(aggregate, "/* --- code-block --- */", "/* --- justified-gallery --- */");
  assert.equal(normalize(show(merge, "src/styles/code-block.css")), normalize(moved));
  assert.equal(normalize(show(merge, "src/styles/components.css")), normalize(aggregate.replace(moved, "")));
});

audit("Wave 4A site navigation is an exact exclusive-family move", () => {
  const merge = merges.wave4a;
  const before = parent(merge);
  const aggregate = show(before, "src/styles/components.css");
  const moved = between(
    aggregate,
    "/* ==================================================\n   Site navigation\n   ================================================== */",
    "/* One global project navigator replaces both the former projects index",
  );
  assert.equal(normalize(show(merge, "src/styles/site-navigation.css")), normalize(moved));
  assert.equal(normalize(show(merge, "src/styles/components.css")), normalize(aggregate.replace(moved, "")));
});

audit("Wave 4B project navigation equals base slice plus previous top extension", () => {
  const merge = merges.wave4b;
  const before = parent(merge);
  const aggregate = show(before, "src/styles/components.css");
  const base = between(
    aggregate,
    "/* One global project navigator replaces both the former projects index",
    "/* ==================================================\n   Project shell and typography\n   ================================================== */",
  );
  const extension = show(before, "src/styles/project-navigation-top.css");
  const owner = show(merge, "src/styles/project-navigation.css");
  assert.equal(normalize(owner), normalize(`${base}${extension}`));
  assert.equal(exists(merge, "src/styles/project-navigation-top.css"), false);
  assert.equal(normalize(show(merge, "src/styles/components.css")), normalize(aggregate.replace(base, "")));
});

audit("Wave 4C project header preserves every old source piece and order", () => {
  const merge = merges.wave4c;
  const before = parent(merge);
  const oldComponents = show(before, "src/styles/components.css");
  const oldDedicated = show(before, "src/styles/project-header.css");
  const oldIndex = show(before, "src/styles/index.css");
  const owner = show(merge, "src/styles/project-header.css");

  const baseHeader = between(oldComponents, ".project__head {", ".project__intro {");
  const wideStart = oldComponents.indexOf("@container project (width > 50rem)");
  assert.ok(wideStart >= 0);
  const wideHead = braceBlock(oldComponents, "  .project__head {", wideStart);
  const wideRole = braceBlock(oldComponents, "  .project__role {", wideStart);
  const lateStart = oldIndex.indexOf("  .project__head {");
  const lateHeader = braceBlock(oldIndex, "  .project__head {", lateStart);

  for (const [piece, label] of [
    [baseHeader, "base header"],
    [wideHead, "wide header"],
    [wideRole, "wide role"],
    [oldDedicated, "previous compact owner"],
    [lateHeader, "late typography"],
  ]) assertContainsExact(owner, piece, `Wave 4C ${label}`);

  const order = [
    owner.indexOf(".project__head {\n  display: grid;"),
    owner.indexOf("@container project (width > 50rem)"),
    owner.indexOf("@container project (width <= 50rem)"),
    owner.lastIndexOf("  .project__head {\n    line-height: var(--lh-heading);"),
  ];
  assert.ok(order.every((value) => value >= 0));
  assert.ok(order.every((value, index) => index === 0 || value > order[index - 1]), `Wave 4C order drift: ${order}`);
});

audit("Wave 4D project shell equals old shell plus old late typography refinements", () => {
  const merge = merges.wave4d;
  const before = parent(merge);
  const oldComponents = show(before, "src/styles/components.css");
  const oldIndex = show(before, "src/styles/index.css");
  const baseShell = between(
    oldComponents,
    "/* ==================================================\n   Project shell and typography\n   ================================================== */",
    ".divider {",
  );
  const late = between(oldIndex, "  .project__title {", "  .group-note,");
  const owner = show(merge, "src/styles/project-shell.css");
  assert.equal(normalize(owner), normalize(`${baseShell}${late}`));
  const aggregateAfter = show(merge, "src/styles/components.css");
  assert.match(aggregateAfter, /\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child\s*\{/);
  assert.doesNotMatch(owner, /\.project__section\s*>\s*:is\(\.media, \.mockup, \.slider\):only-child\s*\{/);
});

audit("#491/#492 is test-only and cannot alter production behavior", () => {
  const merge = merges.test491;
  const before = parent(merge);
  assertFiles(before, merge, ["test/caption-lightbox-contract.test.mjs"], "#492");
});

audit("#495 removes only refactor-introduced EOF whitespace", () => {
  const merge = merges.remediation495;
  const before = parent(merge);
  assert.equal(before, merges.test491);
  const paths = ["src/styles/code-block.css", "src/styles/site-navigation.css"];
  assertFiles(before, merge, paths, "#495");
  for (const path of paths) {
    assert.deepEqual(numstat(before, merge, path), { additions: 0, deletions: 1 }, `${path}: unexpected remediation size`);
    const previous = show(before, path);
    const current = show(merge, path);
    assert.equal(previous, `${current}\n`, `${path}: remediation must delete exactly one final blank line`);
  }
});

audit("Global cascade layer declaration is unchanged from original baseline", () => {
  const original = show(BASELINE, "src/styles/index.css").split("\n").find((line) => line.startsWith("@layer "));
  const current = show(CURRENT, "src/styles/index.css").split("\n").find((line) => line.startsWith("@layer "));
  assert.equal(current, original);
});

audit("Merged dev contains no temporary CSS-refactor execution tooling", () => {
  const files = git(["ls-tree", "-r", "--name-only", CURRENT]).split("\n").filter(Boolean);
  const temporary = files.filter((path) => /(?:^|\/)tmp-css-/.test(path));
  assert.deepEqual(temporary, []);
});

audit("Frozen Wave 5A media core is an exact move from merged dev", () => {
  const aggregate = show(CURRENT, "src/styles/components.css");
  const marker = "/* ==================================================\n   Media item\n   ================================================== */\n";
  const integration = ".project__section > :is(.media, .mockup, .slider):only-child {";
  const core = between(aggregate, marker, integration);
  const owner = show(WAVE5, "src/styles/media.css");
  assert.equal(normalize(owner), normalize(core));
  assert.equal(normalize(show(WAVE5, "src/styles/components.css")), normalize(aggregate.replace(core, "")));
  const currentIndex = show(CURRENT, "src/styles/index.css");
  const expectedIndex = currentIndex.replace(
    '@import "./expertise.css" layer(components);\n@import "./experience.css" layer(components);',
    '@import "./expertise.css" layer(components);\n@import "./media.css" layer(components);\n@import "./experience.css" layer(components);',
  );
  assert.equal(show(WAVE5, "src/styles/index.css"), expectedIndex);
  assert.equal(exists(WAVE5, ".github/workflows/tmp-css-461-media-core.yml"), false, "Wave 5A auto-writer must stay frozen");
  assert.equal(exists(WAVE5, "tools/tmp-css-461-media-core.mjs"), true);
  assert.equal(exists(WAVE5, "tools/tmp-css-461-media-core-browser.mjs"), true);
});

console.log(`\nCSS cumulative source audit passed ${results.length}/${results.length} checks.`);
