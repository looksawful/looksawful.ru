import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { collectDesignSystemInventory } from "../tools/lab/design-system-inventory.mjs";

const exemptPaths = [
  "src/site/pages/content-validation.ts",
  "src/site/pages/manifest.ts",
  "src/site/pages/search-presentation.ts",
  "src/site/pages/types.ts",
  "src/site/pages/validation.ts",
  "src/site/rendering/html.ts",
  "src/site/shell/metadata.ts",
];

test("known non-visual site infrastructure is explicit no-story inventory", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "looksawful-no-story-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  for (const relativePath of exemptPaths) {
    const absolutePath = path.join(root, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, "export const infrastructure = true;", "utf8");
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
