import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const storiesDir = path.join(root, "src/lab/stories");
const files = readdirSync(storiesDir).filter((name) => /\.stories\.(?:js|mjs)$/.test(name));

test("one Storybook catalog has the same complete story set for every build", async () => {
  process.env.PUBLIC_STORYBOOK = "1";
  const { default: publicConfig } = await import("../tools/lab/storybook/main.mjs?public");
  delete process.env.PUBLIC_STORYBOOK;
  const { default: previewConfig } = await import("../tools/lab/storybook/main.mjs?lab");

  assert.deepEqual(publicConfig.stories, previewConfig.stories);
  assert.deepEqual(publicConfig.stories, ["../../../src/lab/stories/**/*.stories.@(js|mjs)"]);
  assert.deepEqual(publicConfig.staticDirs, []);
  assert.equal(previewConfig.staticDirs.length, 1);
});

test("Storybook covers every requested design-system layer with real source-backed stories", () => {
  const titles = files.flatMap((file) => {
    const source = readFileSync(path.join(storiesDir, file), "utf8");
    return [...source.matchAll(/title\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]);
  });
  const chapters = [
    "00 Foundations", "01 Atoms", "02 Molecules", "03 Organisms",
    "04 Layout", "05 Patterns & Templates", "06 Pages",
    "07 Motion", "08 Feedback",
  ];
  for (const chapter of chapters) {
    assert.ok(titles.some((title) => title.startsWith(chapter + "/")), chapter);
  }
  assert.ok(files.length >= 30, "all catalog sections must be populated");
  for (const file of files) {
    const source = readFileSync(path.join(storiesDir, file), "utf8");
    assert.match(source, /looksawful:\s*\{[\s\S]*?sources\s*:/, file + " needs production-source provenance");
  }
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
