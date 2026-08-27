import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { sensetiqueHarshLightSlider } from "../src/data/content/sensetique.ts";

test("HARSH LIGHT stays on the generic slider while sliders fill their content width", async () => {
  assert.equal(sensetiqueHarshLightSlider.className, undefined);

  const css = await readFile(new URL("../src/styles/components.css", import.meta.url), "utf8");
  const rule = css.match(/\.slider\s*\{(?<body>[\s\S]*?)\}/)?.groups?.body ?? "";

  assert.match(rule, /inline-size:\s*100%\s*;/);
  assert.match(rule, /max-inline-size:\s*var\(--project-media-max,\s*72\.5rem\)\s*;/);
  assert.match(rule, /min-inline-size:\s*0\s*;/);
});
