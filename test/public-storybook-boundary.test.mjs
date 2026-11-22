import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const storiesDir = path.join(root, "src/lab/stories");
const files = readdirSync(storiesDir).filter((name) => /\.stories\.(?:js|mjs)$/.test(name));

test("one public Storybook catalog, without private media duplication", async () => {
  const { default: config } = await import("../tools/lab/storybook/main.mjs");
  assert.deepEqual(config.stories, ["../../../src/lab/stories/**/*.stories.@(js|mjs)"]);
  assert.deepEqual(config.staticDirs, []);
});

test("the catalog keeps real primitives without a mandatory section quota", () => {
  for (const core of ["foundations.stories.mjs", "divider.stories.mjs", "project-card.stories.mjs"]) {
    assert.ok(files.includes(core), core + " missing");
  }
  for (const retired of [
    "catalog-guide.stories.mjs", "site-pages.stories.mjs", "entity-fixtures.stories.mjs",
    "foundations-reference.stories.mjs", "gallery-full-content.stories.mjs",
    "model-viewer-controls.stories.mjs",
  ]) {
    assert.ok(!files.includes(retired), retired + " must not be in the public catalog");
  }
  for (const name of files) {
    const source = readFileSync(path.join(storiesDir, name), "utf8");
    assert.match(source, /looksawful:\s*\{[\s\S]*?sources\s*:/, name + " needs production-source provenance");
  }
});

test("runtime asset URLs for 3D loaders resolve to the published origin", async () => {
  const { resolvePublishedAssetUrl } = await import("../src/lab/storybook/published-assets.mjs");
  assert.equal(resolvePublishedAssetUrl("/media/logo-3d/jestei/model.glb"), "https://www.looksawful.ru/media/logo-3d/jestei/model.glb");
  assert.equal(resolvePublishedAssetUrl("/vendor/tool.js"), "https://www.looksawful.ru/vendor/tool.js");
  assert.equal(resolvePublishedAssetUrl("https://cdn.example.org/model.glb"), "https://cdn.example.org/model.glb");
  assert.equal(resolvePublishedAssetUrl("./preview.glb"), "./preview.glb");
});

test("published media are served by the already-public site, not duplicated in Storybook", async () => {
  const { usePublishedAssetUrls } = await import("../src/lab/storybook/published-assets.mjs");
  const fragment = '<img src="/media/gallery/example.webp" alt=""><source srcset="/media/a.webp 1x, /media/b.webp 2x"><script type="application/json">{"src":"/media/logo.glb"}</script>';
  const resolved = usePublishedAssetUrls(fragment);
  assert.match(resolved, /https:\/\/www\.looksawful\.ru\/media\/gallery\/example\.webp/);
  assert.match(resolved, /https:\/\/www\.looksawful\.ru\/media\/a\.webp/);
  assert.match(resolved, /https:\/\/www\.looksawful\.ru\/media\/b\.webp/);
  assert.match(resolved, /https:\/\/www\.looksawful\.ru\/media\/logo\.glb/);
  assert.doesNotMatch(resolved, /src="\/media\//);
});
