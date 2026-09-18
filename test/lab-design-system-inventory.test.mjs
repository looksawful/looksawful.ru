import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  collectDesignSystemInventory,
  validateDesignSystemInventory,
  writeDesignSystemInventory,
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

test("accepts existing declared supporting sources outside the UI denominator", async (t) => {
  const root = await fixture(t, {
    "src/templates/card.ts": "export const render = true;",
    "src/data/card-data.ts": "export const data = true;",
    "src/lab/stories/card.stories.js": `
      import "../../templates/card.ts";
      import "../../data/card-data.ts";
      export default {
        title: "02 Molecules/Card",
        parameters: {
          looksawful: {
            sources: ["src/templates/card.ts", "src/data/card-data.ts"],
            layer: "molecule",
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
  assert.equal(sourceByPath(inventory, "src/data/card-data.ts"), undefined);
  const story = inventory.stories.find((item) => item.path === "src/lab/stories/card.stories.js");
  assert.deepEqual(story.declaredSourceChecks, [
    { path: "src/templates/card.ts", exists: true, role: "ui-owner" },
    { path: "src/data/card-data.ts", exists: true, role: "supporting-source" },
  ]);
  assert.equal(inventory.structuralIssues.length, 0);
});

test("inventory uses canonical story policy and visibility enums", async (t) => {
  const root = await fixture(t, {
    "src/components/card.ts": "export const card = true;",
    "src/lab/stories/card.stories.js": `
      export default { title: "02 Molecules/Card", parameters: { looksawful: {
        sources: ["src/components/card.ts"], layer: "molecule", policy: "no-story",
        canonical: true, state: "default", visibility: ["route-discovery"]
      } } };
    `,
  });
  const inventory = await collectDesignSystemInventory(root);
  assert.ok(inventory.structuralIssues.some((issue) => issue.code === "unknown-policy"));
  assert.ok(inventory.structuralIssues.some((issue) => issue.code === "unknown-visibility"));
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


test("preserves story route discovery separately from visual visibility", async (t) => {
  const root = await fixture(t, {
    "src/site/renderers/entity-page.ts": "export const render = true;",
    "src/lab/stories/unlisted-page.stories.js": `
      export default { title: "05 Pages/Entity/Unlisted", parameters: { looksawful: {
        sources: ["src/site/renderers/entity-page.ts"], layer: "page", policy: "page",
        canonical: true, state: "ready", visibility: ["always"],
        routeDiscovery: { listed: false, indexable: false }
      } } };
    `,
  });
  const inventory = await collectDesignSystemInventory(root);
  const story = inventory.stories.at(0);
  assert.deepEqual(story.routeDiscovery, { listed: false, indexable: false });
  assert.deepEqual(story.visibility, ["always"]);
  assert.equal(sourceByPath(inventory, "src/site/renderers/entity-page.ts").overallStatus, "page-only");
});
test("aggregates canonical declared story states and visibility into source coverage", async (t) => {
  const root = await fixture(t, {
    "src/components/menu.ts": "export const menu = true;",
    "src/lab/stories/menu-closed.stories.js": `export default { title: "03 Organisms/Menu Closed", parameters: { looksawful: {
      sources: ["src/components/menu.ts"], layer: "organism", policy: "isolated",
      canonical: true, state: "closed", visibility: ["desktop", "tablet"]
    } } };`,
    "src/lab/stories/menu-open.stories.js": `export default { title: "03 Organisms/Menu Open", parameters: { looksawful: {
      sources: ["src/components/menu.ts"], layer: "organism", policy: "isolated",
      canonical: true, state: "open", visibility: ["mobile", "reduced-motion"]
    } } };`,
  });
  const inventory = await collectDesignSystemInventory(root);
  assert.deepEqual(sourceByPath(inventory, "src/components/menu.ts").stateCoverage, {
    states: ["closed", "open"],
    visibility: ["desktop", "mobile", "reduced-motion", "tablet"],
  });
});

test("generated inventory title matches the Lab deployment contract", async (t) => {
  const root = await fixture(t, {});
  const outDir = path.join(root, "dist", "lab");
  await writeDesignSystemInventory({ root, outDir });
  const html = await readFile(path.join(outDir, "system", "inventory.html"), "utf8");
  assert.match(html, /<title>looksawful Storybook inventory<\/title>/i);
});

