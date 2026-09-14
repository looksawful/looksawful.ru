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
    "src/lab/stories/button.stories.mjs": `
      import "../../components/button.ts";
      export default { title: "01 Atoms/Button" };
    `,
  });
  const inventory = await collectDesignSystemInventory(root);
  assert.equal(inventory.stories.length, 1);
  assert.equal(inventory.stories[0].path, "src/lab/stories/button.stories.mjs");
});

test("does not use duplicate basenames as proof of coverage", async (t) => {
  const root = await fixture(t, {
    "src/components/a/card.ts": "export const a = true;",
    "src/components/b/card.ts": "export const b = true;",
    "src/lab/stories/card.stories.js": `
      import "../../components/a/card.ts";
      export default { title: "01 Atoms/Card" };
    `,
  });
  const inventory = await collectDesignSystemInventory(root);
  const first = sourceByPath(inventory, "src/components/a/card.ts");
  const second = sourceByPath(inventory, "src/components/b/card.ts");
  assert.equal(first.overallStatus, "partial");
  assert.equal(first.storyRefs[0].evidence, "import");
  assert.equal(second.overallStatus, "missing");
  assert.deepEqual(second.storyRefs, []);
});

test("explicit looksawful.sources metadata strongly links one story to multiple canonical sources", async (t) => {
  const root = await fixture(t, {
    "src/components/before-after.ts": "export const runtime = true;",
    "src/templates/before-after.ts": "export const render = true;",
    "src/lab/stories/before-after.stories.js": `
      import "../../components/before-after.ts";
      import "../../templates/before-after.ts";
      const meta = {
        title: "02 Molecules/Before After",
        parameters: {
          looksawful: {
            sources: ["src/components/before-after.ts", "src/templates/before-after.ts"],
            layer: "molecule",
            policy: "isolated",
            canonical: true,
            state: "default",
            visibility: ["always"]
          }
        }
      };
      export default meta;
    `,
  });
  const inventory = await collectDesignSystemInventory(root);
  const component = sourceByPath(inventory, "src/components/before-after.ts");
  const template = sourceByPath(inventory, "src/templates/before-after.ts");
  for (const source of [component, template]) {
    assert.equal(source.overallStatus, "covered");
    assert.equal(source.storyRefs[0].evidence, "declared-source");
    assert.equal(source.storyRefs[0].confidence, "strong");
    assert.equal(source.layer, "molecule");
  }
  assert.equal(template.sourceKind, "template");
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
    "src/lab/stories/model-viewer.stories.js": `
      import "../../components/model-viewer.ts";
      export default {
        title: "90 Experimental/Model Viewer",
        parameters: {
          looksawful: {
            sources: ["src/components/model-viewer.ts"],
            layer: "experimental",
            policy: "experimental",
            canonical: false,
            state: "prototype",
            visibility: ["always"]
          }
        }
      };
    `,
  });
  const inventory = await collectDesignSystemInventory(root);
  const source = sourceByPath(inventory, "src/components/model-viewer.ts");
  assert.equal(inventory.stories[0].status, "experimental");
  assert.equal(source.overallStatus, "missing");
  assert.equal(source.storyRefs[0].canonical, false);
});

test("extracts route discovery without treating it as visual visibility", async (t) => {
  const root = await fixture(t, {
    "src/site/pages/manifest.ts": `
      export const pages = [
        { id: "home", path: "/", listed: true, indexable: true },
        { id: "hidden-project", path: "/work/hidden/", listed: false, indexable: false }
      ];
    `,
  });
  const inventory = await collectDesignSystemInventory(root);
  const route = inventory.routes.find((item) => item.id === "hidden-project");
  assert.deepEqual(route.discovery, { listed: false, indexable: false });
  assert.equal(Object.hasOwn(route, "visibility"), false);
});

test("reports structural errors for declared source paths that do not exist", async (t) => {
  const root = await fixture(t, {
    "src/lab/stories/broken.stories.js": `
      export default {
        title: "01 Atoms/Broken",
        parameters: {
          looksawful: {
            sources: ["src/components/missing.ts"],
            layer: "atom",
            policy: "isolated",
            canonical: true,
            state: "default",
            visibility: ["always"]
          }
        }
      };
    `,
  });
  const inventory = await collectDesignSystemInventory(root);
  const issues = validateDesignSystemInventory(inventory);
  assert.ok(issues.some((issue) =>
    issue.severity === "error" && issue.code === "declared-source-missing"
  ));
});
