import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("site smoke waits for a lightbox-open condition before asserting state", async () => {
  const readiness = await read("tools/e2e/readiness.mjs");
  const smoke = await read("tools/e2e/smoke-site.mjs");

  // A click may start PhotoSwipe's async module load; state must not be sampled eagerly.
  assert.match(readiness, /export async function waitForLightboxOpen\(page\)/);
  assert.match(readiness, /waitForFunction\([\s\S]*\.pswp[\s\S]*data-media-lightbox/);
  assert.match(smoke, /import \{[^}]*waitForLightboxOpen[^}]*\} from "\.\/readiness\.mjs"/);

  const helper = smoke.match(/async function assertLightboxOpen\(page, label\) \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(helper, /await waitForLightboxOpen\(page\)/);
  assert.ok(helper.indexOf("waitForLightboxOpen") < helper.indexOf("lightboxState"));
});

test("shared readiness helpers have explicit finite browser wait bounds", async () => {
  const readiness = await read("tools/e2e/readiness.mjs");

  assert.match(readiness, /const READINESS_TIMEOUT_MS = 10_000/);
  assert.match(readiness, /const MEDIA_METADATA_TIMEOUT_MS = 8_000/);
  assert.match(readiness, /waitFor\(\{[\s\S]*state: "attached",[\s\S]*timeout: READINESS_TIMEOUT_MS/);
  assert.match(readiness, /document\.fonts\.status === "loaded"[\s\S]*timeout: READINESS_TIMEOUT_MS/);
  assert.match(readiness, /animation frame readiness timed out after \$\{timeoutMs\} ms/);
  assert.match(readiness, /lightbox video metadata timed out after \$\{timeoutMs\} ms/);
  assert.match(readiness, /data-media-lightbox\]\[open\][\s\S]*timeout: READINESS_TIMEOUT_MS/);
});

test("video resume smoke proves a non-zero seek without failing as autoplay advances", async () => {
  const smoke = await read("tools/e2e/smoke-site.mjs");

  // The lightbox may already be playing by the time state is sampled; only regressions toward zero are invalid.
  assert.match(smoke, /video\.duration > 5 \? 2 : video\.duration > 0\.6 \? 0\.25 : 0/);
  assert.match(smoke, /state\.videoCurrentTime \+ 0\.15 >= expected\.resumeAt/);
  assert.doesNotMatch(smoke, /Math\.abs\(state\.videoCurrentTime - expected\.resumeAt\) < 0\.35/);
});
