import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Storybook is integrated into the isolated Private Lab artifact", async () => {
  const [packageJson, labHtml, builder, inventory, main, labConfig, workflow] = await Promise.all([
    read("package.json"),
    read("lab/index.html"),
    read("tools/lab/build-storybook.mjs"),
    read("tools/lab/design-system-inventory.mjs"),
    read("tools/lab/storybook/main.mjs"),
    read("vite.lab.config.ts"),
    read(".github/workflows/private-lab-verify.yml"),
  ]);
  assert.match(packageJson, /"lab:system":\s*"node tools\/lab\/build-storybook\.mjs"/);
  assert.match(packageJson, /"lab:inventory":\s*"node tools\/lab\/design-system-inventory\.mjs"/);
  assert.match(labHtml, /href="\/lab\/system\/"/);
  assert.match(labHtml, /href="\/lab\/system\/inventory\.html"/);
  assert.match(builder, /path\.join\("dist-lab", "lab"\)/);
  assert.match(inventory, /path\.join\(root, "dist-lab", "lab"\)/);
  assert.match(main, /staticDirs:[\s\S]*public/);
  assert.match(labConfig, /outDir:\s*"dist-lab"/);
  assert.match(workflow, /Prepare production media for Storybook[\s\S]*npm run media:ensure[\s\S]*npm run lab:system/);
  assert.match(workflow, /Build private Storybook design system[\\s\\S]*timeout-minutes:\\s*12[\\s\\S]*run:\\s*npm run lab:system/);
});
