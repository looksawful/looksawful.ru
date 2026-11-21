import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("public Storybook is a strict, asset-free allowlist", async () => {
  process.env.PUBLIC_STORYBOOK = "1";
  const { default: config } = await import("../tools/lab/storybook/main.mjs?public");
  delete process.env.PUBLIC_STORYBOOK;

  const approved = [
    "../../../src/lab/stories/foundations.stories.mjs",
    "../../../src/lab/stories/css-patterns.stories.mjs",
    "../../../src/lab/stories/divider.stories.mjs",
  ];
  assert.deepEqual(config.stories, approved);
  assert.deepEqual(config.staticDirs, []);
  for (const story of approved) {
    const text = readFileSync(new URL("../tools/lab/storybook/" + story, import.meta.url), "utf8");
    assert.doesNotMatch(text, /(?:from|import)\s*\(?\s*["'][^"']*\/(?:data|content|specialized|templates)\//);
    assert.doesNotMatch(text, /<img\b|<video\b|\/media\/|jesteiIntro|sensetiqueProductionIntro/i);
  }
});

test("private Storybook keeps its existing comprehensive stories", async () => {
  delete process.env.PUBLIC_STORYBOOK;
  const { default: config } = await import("../tools/lab/storybook/main.mjs?private");
  assert.deepEqual(config.stories, ["../../../src/lab/stories/**/*.stories.@(js|mjs)"]);
  assert.equal(config.staticDirs.length, 1);
});
