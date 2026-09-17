import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const stories = [
  "src/lab/stories/before-after.stories.js",
  "src/lab/stories/site-navigation.stories.js",
  "src/lab/stories/project-navigation.stories.js",
  "src/lab/stories/media-slider.stories.js",
  "src/lab/stories/berserk-audio-player.stories.js",
  "src/lab/stories/jestei-track-filter.stories.js",
  "src/lab/stories/awful-cases-game.stories.js",
  "src/lab/stories/jestei-theme-organism.stories.js",
];

test("runtime organism stories declare canonical behavior checks", async () => {
  for (const path of stories) {
    const text = await readFile(path, "utf8");
    assert.match(text, /title:\s*["']03 Organisms\//, path);
    assert.match(text, /looksawful:\s*\{/, path);
    assert.match(text, /canonical:\s*true/, path);
    assert.match(text, /layer:\s*["']organism["']/, path);
    assert.match(text, /from ["']storybook\/test["']/, `${path}: Storybook test API`);
    assert.match(text, /play:\s*async/, `${path}: play assertions`);
    assert.match(text, /expect\(/, `${path}: behavior assertion`);
  }
});
