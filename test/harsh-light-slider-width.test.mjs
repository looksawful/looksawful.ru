import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sensetiqueHarshLightSlider } from "../src/data/content/sensetique.ts";
import { renderMediaSlider } from "../src/templates/media-slider.ts";

test("HARSH LIGHT keeps intrinsic image sizing without changing the generic slider width contract", async () => {
  const html = renderMediaSlider(sensetiqueHarshLightSlider);

  assert.match(html, /<img[^>]*height="426"[^>]*width="640"/);
  assert.match(html, /<img[^>]*height="800"[^>]*width="929"/);

  const css = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
  const rule = css.match(/\.slider\s*\{(?<body>[\s\S]*?)\}/)?.groups?.body ?? "";

  assert.match(rule, /inline-size:\s*min\(100%,\s*var\(--project-media-max,\s*72\.5rem\)\)\s*;/);
  assert.doesNotMatch(rule, /max-inline-size:/);
  assert.match(rule, /min-inline-size:\s*0\s*;/);
});
