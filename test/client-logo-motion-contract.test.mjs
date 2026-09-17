import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const runtime = readFileSync(new URL("../src/components/client-logo-motion.ts", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/components/client-logo-motion.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

test("client logo motion stays scoped to the existing logo wall", () => {
  assert.match(runtime, /\.portfolio-logo-wall/);
  assert.match(runtime, /data-infinite-reel-track/);
  assert.match(runtime, /portfolio-logo-wall__item/);
  assert.match(runtime, /data-infinite-reel-clone/);
});

test("client logo motion respects lifecycle and motion preferences", () => {
  assert.match(runtime, /IntersectionObserver/);
  assert.match(runtime, /MutationObserver/);
  assert.match(runtime, /visibilitychange/);
  assert.match(runtime, /motion\?\.subscribe/);
  assert.match(runtime, /allowsMotion/);
});

test("client logo motion includes pointer interaction without taking over the reel transform", () => {
  assert.match(runtime, /pointermove/);
  assert.match(runtime, /pointerleave/);
  assert.doesNotMatch(runtime, /data-infinite-reel-track[^\n]*transform/);
  assert.match(styles, /transform-style:\s*preserve-3d/);
});

test("client logo motion mounts after the infinite reel runtime", () => {
  const reelIndex = main.indexOf("createInfiniteReels({ root: document, motion })");
  const logoIndex = main.indexOf("createClientLogoMotion({ root: document, motion })");

  assert.notEqual(reelIndex, -1);
  assert.notEqual(logoIndex, -1);
  assert.ok(reelIndex < logoIndex, "logo motion should decorate the mounted reel, not own its geometry");
});
