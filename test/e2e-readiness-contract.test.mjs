import assert from "node:assert/strict";
import test from "node:test";

import { waitForLightboxOpen } from "../tools/e2e/readiness.mjs";

test("lightbox readiness waits for open state, media metadata and a render frame in order", async () => {
  const calls = [];
  const page = {
    async waitForFunction() {
      calls.push("open");
    },
    async evaluate(_callback, argument) {
      calls.push(argument === 1 ? "render-frame" : "media-metadata");
    },
  };

  await waitForLightboxOpen(page);
  assert.deepEqual(calls, ["open", "media-metadata", "render-frame"]);
});
