import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rendererPaths = [
  "../src/templates/media-slider.ts",
  "../src/templates/mockup-deck.ts",
];

for (const rendererPath of rendererPaths) {
  test(`${rendererPath} gives labeled slider controls explicit group semantics`, async () => {
    const source = await readFile(new URL(rendererPath, import.meta.url), "utf8");
    const sliderControls = source.match(/<div[^>]*class=\\?"slider-controls cluster\\?"[^>]*>/g) ?? [];

    assert.ok(sliderControls.length > 0, `${rendererPath} must render slider controls`);
    for (const wrapper of sliderControls) {
      assert.match(wrapper, /aria-label=\\?"Навигация по слайдам\\?"/);
      assert.match(wrapper, /role=\\?"group\\?"/);
    }
  });
}
