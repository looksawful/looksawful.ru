import assert from "node:assert/strict";
import test from "node:test";

import { waitForLightboxOpen } from "../tools/e2e/readiness.mjs";
import {
  getVideoResumeTarget,
  hasVideoReachedResumeTarget,
} from "../tools/e2e/smoke-site.mjs";

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

test("video resume target stays non-zero for seekable media and tolerates autoplay advance", () => {
  assert.equal(getVideoResumeTarget(Number.NaN), 0);
  assert.equal(getVideoResumeTarget(0.6), 0);
  assert.equal(getVideoResumeTarget(0.61), 0.25);
  assert.equal(getVideoResumeTarget(5), 0.25);
  assert.equal(getVideoResumeTarget(5.01), 2);

  assert.equal(hasVideoReachedResumeTarget(0, 0), true);
  assert.equal(hasVideoReachedResumeTarget(0.1, 0.25), true);
  assert.equal(hasVideoReachedResumeTarget(0.09, 0.25), false);
  assert.equal(hasVideoReachedResumeTarget(2.4, 2), true);
});
