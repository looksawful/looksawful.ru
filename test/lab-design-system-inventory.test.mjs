import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  collectDesignSystemInventory,
  validateDesignSystemInventory,
} from "../tools/lab/design-system-inventory.mjs";

async function fixture(t, files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "looksawful-inventory-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  await Promise.all(Object.entries(files).map(async ([relativePath, content]) => {
    const absolutePath = path.join(root, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");
  }));
  return root;
}

const sourceByPath = (inventory, sourcePath) =>
  inventory.sources.find((source) => source.path === sourcePath);

test("discovers .stories.mjs files accepted by Storybook", async (t) => {
  const root = await fixture(t, {
    "src/components/button.ts": "export const button = true;",
    "src/lab/stories/button.stories.mjs": `import "../../components/button.ts"; export default { title: "01 Atoms/Button" };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  assert.equal(inventory.stories.length, 1);
  assert.equal(inventory.stories[0].path, "src/lab/stories/button.stories.mjs");
});

test("does not use duplicate basenames as proof of coverage", async (t) => {
  const root = await fixture(t, {
    "src/components/a/card.ts": "export const a = true;",
    "src/components/b/card.ts": "export const b = true;",
    "src/lab/stories/card.stories.js": `import "../../components/a/card.ts"; export default { title: "01 Atoms/Card" };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  assert.equal(sourceByPath(inventory, "src/components/a/card.ts").overallStatus, "partial");
  assert.equal(sourceByPath(inventory, "src/components/b/card.ts").overallStatus, "missing");
});

test("explicit looksawful.sources metadata strongly links canonical owners", async (t) => {
  const root = await fixture(t, {
    "src/components/before-after.ts": "export const runtime = true;",
    "src/templates/before-after.ts": "export const render = true;",
    "src/lab/stories/before-after.stories.js": `export default { title: "02 Molecules/Before After", parameters: { looksawful: { sources: ["src/components/before-after.ts", "src/templates/before-after.ts"], layer: "molecule", policy: "isolated", canonical: true, state: "default", visibility: ["always"] } } };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  for (const path of ["src/components/before-after.ts", "src/templates/before-after.ts"]) {
    const source = sourceByPath(inventory, path);
    assert.equal(source.overallStatus, "covered");
    assert.equal(source.storyRefs[0].evidence, "declared-source");
  }
});

test("includes production UI owners under src/site", async (t) => {
  const root = await fixture(t, {
    "src/site/renderers/project-card.ts": "export const render = true;",
    "src/site/navigation/site-navigation.ts": "export const nav = true;",
    "src/site/shell/site-shell.ts": "export const shell = true;",
  });
  const inventory = await collectDesignSystemInventory(root);
  assert.equal(sourceByPath(inventory, "src/site/renderers/project-card.ts").sourceKind, "renderer");
  assert.equal(sourceByPath(inventory, "src/site/navigation/site-navigation.ts").sourceKind, "navigation");
  assert.equal(sourceByPath(inventory, "src/site/shell/site-shell.ts").sourceKind, "shell");
});

test("experimental stories do not count as canonical production coverage", async (t) => {
  const root = await fixture(t, {
    "src/components/model-viewer.ts": "export const viewer = true;",
    "src/lab/stories/model-viewer.stories.js": `export default { title: "90 Experimental/Model Viewer", parameters: { looksawful: { sources: ["src/components/model-viewer.ts"], layer: "experimental", policy: "experimental", canonical: false, state: "prototype", visibility: ["always"] } } };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  assert.equal(inventory.stories[0].status, "experimental");
  assert.equal(sourceByPath(inventory, "src/components/model-viewer.ts").overallStatus, "missing");
});

test("route manifest is explicitly no-story and excluded from denominator", async (t) => {
  const root = await fixture(t, {
    "src/site/pages/manifest.ts": `export const pages = [{ id: "hidden-project", path: "/work/hidden/", listed: false, indexable: false }];`,
    "src/components/card.ts": "export const card = true;",
  });
  const inventory = await collectDesignSystemInventory(root);
  const manifest = sourceByPath(inventory, "src/site/pages/manifest.ts");
  assert.equal(manifest.storyPolicy, "no-story");
  assert.equal(manifest.denominatorEligible, false);
  assert.equal(manifest.overallStatus, "exempt-no-story");
  assert.equal(inventory.coverageSummary.denominator, 1);
  assert.equal(inventory.coverageSummary.excludedNoStory, 1);
  assert.equal(inventory.coverageSummary.missing, 1);
  assert.deepEqual(inventory.routes[0].discovery, { listed: false, indexable: false });
});

test("HTML rendering utility is explicitly no-story and excluded from denominator", async (t) => {
  const root = await fixture(t, {
    "src/site/rendering/html.ts": "export const replaceRequiredSlot = () => true;",
    "src/components/card.ts": "export const card = true;",
    "src/lab/stories/card.stories.js": `import "../../site/rendering/html.ts"; export default { title: "01 Atoms/Card" };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  const html = sourceByPath(inventory, "src/site/rendering/html.ts");
  assert.equal(html.lifecycle, "infrastructure");
  assert.equal(html.storyPolicy, "no-story");
  assert.equal(html.denominatorEligible, false);
  assert.equal(html.overallStatus, "exempt-no-story");
  assert.equal(inventory.coverageSummary.denominator, 1);
  assert.equal(inventory.coverageSummary.excludedNoStory, 1);
  assert.equal(inventory.coverageSummary.partial, 0);
});

test("accepts existing declared supporting sources outside the UI denominator", async (t) => {
  const root = await fixture(t, {
    "src/templates/card.ts": "export const render = true;",
    "src/data/card-data.ts": "export const data = true;",
    "src/lab/stories/card.stories.js": `import "../../templates/card.ts"; import "../../data/card-data.ts"; export default { title: "02 Molecules/Card", parameters: { looksawful: { sources: ["src/templates/card.ts", "src/data/card-data.ts"], layer: "molecule", policy: "isolated", canonical: true, state: "default", visibility: ["always"] } } };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  assert.equal(sourceByPath(inventory, "src/data/card-data.ts"), undefined);
  assert.equal(inventory.coverageSummary.denominator, 1);
  assert.equal(inventory.coverageSummary.covered, 1);
});

test("records structured canonical state coverage by owner", async (t) => {
  const root = await fixture(t, {
    "src/components/menu.ts": "export const menu = true;",
    "src/lab/stories/menu.stories.js": `export default { title: "03 Organisms/Menu", parameters: { looksawful: { sources: ["src/components/menu.ts"], layer: "organism", policy: "behavior-fixture", canonical: true, state: "menu-open", visibility: ["disclosure", "overlay"], interaction: ["open", "focus-visible"], data: ["ready"], motion: ["reduced-motion"], responsive: { review: ["desktop", "tablet", "mobile"], conditions: ["(hover: hover) and (pointer: fine)"] } } } };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  const source = sourceByPath(inventory, "src/components/menu.ts");
  assert.deepEqual(source.stateCoverage.states, ["menu-open"]);
  assert.deepEqual(source.stateCoverage.visibility, ["disclosure", "overlay"]);
  assert.deepEqual(source.stateCoverage.interaction, ["focus-visible", "open"]);
  assert.deepEqual(source.stateCoverage.data, ["ready"]);
  assert.deepEqual(source.stateCoverage.motion, ["reduced-motion"]);
  assert.deepEqual(source.stateCoverage.reviewViewports, ["desktop", "mobile", "tablet"]);
  assert.deepEqual(source.stateCoverage.responsiveConditions, ["(hover: hover) and (pointer: fine)"]);
});

test("inventory uses canonical story policy and visibility enums", async (t) => {
  const root = await fixture(t, {
    "src/components/card.ts": "export const card = true;",
    "src/lab/stories/card.stories.js": `export default { title: "02 Molecules/Card", parameters: { looksawful: { sources: ["src/components/card.ts"], layer: "molecule", policy: "no-story", canonical: true, state: "default", visibility: ["route-discovery"] } } };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  assert.ok(inventory.structuralIssues.some((issue) => issue.code === "unknown-policy"));
  assert.ok(inventory.structuralIssues.some((issue) => issue.code === "unknown-visibility"));
});

test("reports structural errors for declared source paths that do not exist", async (t) => {
  const root = await fixture(t, {
    "src/lab/stories/broken.stories.js": `export default { title: "01 Atoms/Broken", parameters: { looksawful: { sources: ["src/components/missing.ts"], layer: "atom", policy: "isolated", canonical: true, state: "default", visibility: ["always"] } } };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  const issues = validateDesignSystemInventory(inventory);
  assert.ok(issues.some((issue) => issue.severity === "error" && issue.code === "declared-source-missing"));
});
