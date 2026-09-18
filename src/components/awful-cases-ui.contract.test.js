import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Awful Cases exposes onboarding and contextual guidance in both surfaces", async () => {
  const [component, standalone, runtime] = await Promise.all([
    read("./specialized/awful-cases-game.ts"),
    read("../../public/pets/awful-cases/index.html"),
    read("./awful-cases-runtime.js"),
  ]);

  for (const source of [component, standalone]) {
    assert.match(source, /data-awful-cases-onboarding/);
    assert.match(source, /data-awful-cases-onboarding-actions/);
    assert.match(source, /data-awful-cases-prompt/);
  }
  assert.match(runtime, /data-awful-cases-onboarding-actions/);
  assert.match(runtime, /button\.dataset\.active/);
  assert.match(runtime, /sessionAccuracy/);
});
