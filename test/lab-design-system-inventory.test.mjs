import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { collectDesignSystemInventory } from "../tools/lab/design-system-inventory.mjs";

test("design-system inventory deterministically reports canonical owners and matching stories", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "looksawful-lab-inventory-"));
  t.after(async () => rm(root, { recursive: true, force: true }));

  await Promise.all([
    mkdir(path.join(root, "src/components/content"), { recursive: true }),
    mkdir(path.join(root, "src/styles"), { recursive: true }),
    mkdir(path.join(root, "src/templates"), { recursive: true }),
    mkdir(path.join(root, "src/lab/stories"), { recursive: true }),
  ]);

  await Promise.all([
    writeFile(path.join(root, "src/components/content/code-block.ts"), "export const codeBlock = true;\n"),
    writeFile(path.join(root, "src/components/plain.ts"), "export const plain = true;\n"),
    writeFile(path.join(root, "src/styles/code-block.css"), ".code-block {}\n"),
    writeFile(path.join(root, "src/templates/before-after.ts"), "export const beforeAfter = true;\n"),
    writeFile(path.join(root, "src/lab/stories/code-block.stories.ts"), "export default { title: '02 Molecules/Code Block' };\n"),
  ]);

  const inventory = await collectDesignSystemInventory(root);

  assert.equal(inventory.generatedAt, null);
  assert.deepEqual(inventory.components, [
    {
      path: "src/components/content/code-block.ts",
      kind: "component",
      storyPaths: ["src/lab/stories/code-block.stories.ts"],
      documented: true,
    },
    {
      path: "src/components/plain.ts",
      kind: "component",
      storyPaths: [],
      documented: false,
    },
  ]);
  assert.deepEqual(inventory.styles, [
    { path: "src/styles/code-block.css", kind: "style" },
  ]);
  assert.deepEqual(inventory.templates, [
    { path: "src/templates/before-after.ts", kind: "template" },
  ]);
  assert.deepEqual(inventory.stories, [
    { path: "src/lab/stories/code-block.stories.ts", kind: "story" },
  ]);
});
