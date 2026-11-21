import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import primitives, { Divider, MediaImage } from "../src/lab/stories/production-primitives.stories.mjs";

test("atoms render existing production primitives, not speculative buttons", async () => {
  assert.equal(primitives.title, "01 Atoms/Production Primitives");
  assert.equal(primitives.parameters.looksawful.canonical, true);
  assert.match(Divider.render(), /class="divider" aria-hidden="true"/);
  assert.match(MediaImage.render(), /<img\b/);
  assert.match(MediaImage.render(), /src="\/pets\//);
  assert.match(MediaImage.render(), /srcset="\/media\/generated\/responsive\//);
  const section = readFileSync(new URL("../src/site/renderers/entity/section.ts", import.meta.url), "utf8");
  assert.match(section, /class=\"divider\" aria-hidden=\"true\"/);
  assert.deepEqual(Object.keys(await import("../src/lab/stories/production-primitives.stories.mjs")).sort(), ["Divider", "MediaImage", "default"]);
});
