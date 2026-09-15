import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { collectDesignSystemInventory } from "../tools/lab/design-system-inventory.mjs";

const exemptPaths = [
  "src/components/caption-trust.ts",
  "src/components/composition/index.ts",
  "src/components/content/index.ts",
  "src/components/deferred-video-source.ts",
  "src/components/gallery/gallery-entry.ts",
  "src/components/gallery/gallery-state.ts",
  "src/components/media-runtime-health.ts",
  "src/components/motion-preference.ts",
  "src/components/runtime/index.ts",
  "src/components/specialized/index.ts",
  "src/site/navigation/model.ts",
  "src/site/navigation/primary.ts",
  "src/site/pages/content-validation.ts",
  "src/site/pages/entity-presentation.ts",
  "src/site/pages/homepage.ts",
  "src/site/pages/manifest.ts",
  "src/site/pages/search-presentation.ts",
  "src/site/pages/types.ts",
  "src/site/pages/validation.ts",
  "src/site/renderers/home/home-image-deferral.ts",
  "src/site/renderers/home/home-media-deferral.ts",
  "src/site/rendering/html.ts",
  "src/site/shell/metadata.ts",
];

test("known non-visual support sources are explicit no-story inventory", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "looksawful-no-story-"));
  t.after(async () => rm(root, { recursive: true, force: true }));

  for (const relativePath of exemptPaths) {
    const absolutePath = path.join(root, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, "export const support = true;", "utf8");
  }

  const inventory = await collectDesignSystemInventory(root);
  for (const sourcePath of exemptPaths) {
    const source = inventory.sources.find((item) => item.path === sourcePath);
    assert.equal(source?.lifecycle, "infrastructure", sourcePath);
    assert.equal(source?.storyPolicy, "no-story", sourcePath);
    assert.equal(source?.overallStatus, "exempt-no-story", sourcePath);
  }
  assert.equal(inventory.structuralIssues.length, 0);
});

test("declared no-story sources remain supporting evidence, not UI owners", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "looksawful-no-story-ref-"));
  t.after(async () => rm(root, { recursive: true, force: true }));

  const sourcePath = "src/site/pages/manifest.ts";
  await mkdir(path.join(root, "src/site/pages"), { recursive: true });
  await mkdir(path.join(root, "src/lab/stories"), { recursive: true });
  await writeFile(path.join(root, sourcePath), "export const manifest = true;", "utf8");
  await writeFile(
    path.join(root, "src/lab/stories/page.stories.js"),
    `export default { title: "05 Pages/Test", parameters: { looksawful: { sources: ["${sourcePath}"], layer: "page", policy: "page", canonical: true, state: "default", visibility: ["always"] } } };`,
    "utf8",
  );

  const inventory = await collectDesignSystemInventory(root);
  const story = inventory.stories.at(0);
  assert.equal(story?.declaredSourceChecks?.at(0)?.role, "supporting-source");
});