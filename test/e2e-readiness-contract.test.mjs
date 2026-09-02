import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("site smoke waits for a lightbox-open condition before asserting state", async () => {
  const readiness = await read("tools/e2e/readiness.mjs");
  const smoke = await read("tools/smoke-site.mjs");

  // A click may start PhotoSwipe's async module load; state must not be sampled eagerly.
  assert.match(readiness, /export async function waitForLightboxOpen\(page\)/);
  assert.match(readiness, /waitForFunction\([\s\S]*\.pswp[\s\S]*data-media-lightbox/);
  assert.match(smoke, /import \{[^}]*waitForLightboxOpen[^}]*\} from "\.\/e2e\/readiness\.mjs"/);

  const helper = smoke.match(/async function assertLightboxOpen\(page, label\) \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(helper, /await waitForLightboxOpen\(page\)/);
  assert.ok(helper.indexOf("waitForLightboxOpen") < helper.indexOf("lightboxState"));
});

test("video resume smoke proves a non-zero seek without failing as autoplay advances", async () => {
  const smoke = await read("tools/smoke-site.mjs");

  assert.match(smoke, /video\.duration > 5 \? 2 : video\.duration > 0\.6 \? 0\.25 : 0/);
  assert.match(smoke, /state\.videoCurrentTime \+ 0\.15 >= expected\.resumeAt/);
  assert.doesNotMatch(smoke, /Math\.abs\(state\.videoCurrentTime - expected\.resumeAt\) < 0\.35/);
});
