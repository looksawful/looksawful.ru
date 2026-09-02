import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { cvContent } from "../src/data/cv.ts";
import { readCvContent } from "../tools/lib/cv-content.mjs";

test("explicit editorial CV override composes with canonical structural state", async () => {
  const parsed = await readCvContent(
    fileURLToPath(new URL("../src/content/editorial/cv.json", import.meta.url)),
  );

  assert.deepEqual(parsed, cvContent);
  assert.ok(parsed.experience.every(({ visible }) => typeof visible === "boolean"));
  assert.ok(parsed.experience.every(({ links }) => Array.isArray(links)));
});
