import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fastTests } from "../tools/ci/run-tests.mjs";

const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const motion = readFileSync(new URL("../src/styles/motion.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../src/components/infinite-reel.ts", import.meta.url), "utf8");

const fallback = "var(--infinite-reel-fade-size, clamp(2rem, 7cqi, 6rem))";

test("Wave5K keeps infinite reel fade size as one authored input with consumer fallbacks", () => {
  assert.match(
    components,
    /\.portfolio-logo-wall\s*\{[\s\S]*?--infinite-reel-fade-size:\s*clamp\(1\.5rem,\s*4cqi,\s*4rem\);/,
  );
  assert.doesNotMatch(
    components,
    /\[data-infinite-reel\]\s*\{[\s\S]*?--infinite-reel-fade-size:\s*clamp\(2rem,\s*7cqi,\s*6rem\);/,
    "generic infinite reel must not overwrite the authored fade-size input",
  );

  const fallbackCount = components.split(fallback).length - 1;
  assert.equal(
    fallbackCount,
    4,
    "both prefixed and standard masks must resolve the authored fade size at both gradient stops",
  );
});

test("Wave5K does not absorb infinite reel motion or runtime lifecycle ownership", () => {
  assert.match(motion, /\[data-infinite-reel\]\s*\{[\s\S]*?--infinite-reel-speed:\s*var\(--motion-speed-autoscroll\);/);
  assert.match(motion, /\[data-infinite-reel\]\[data-animated="true"\][\s\S]*?animation-play-state:\s*paused;/);
  assert.match(motion, /\[data-infinite-reel\]\[data-animated="true"\]\[data-infinite-reel-active\][\s\S]*?animation-play-state:\s*running;/);
  assert.match(runtime, /root\.setAttribute\("data-animated",\s*"true"\);/);
  assert.match(runtime, /root\.toggleAttribute\("data-infinite-reel-active",\s*active\);/);
});

test("Wave5K infinite reel fade contract is mandatory in Fast CI", () => {
  assert.equal(fastTests.has("test/css-refactor-wave5k-infinite-reel-fade-contract.test.mjs"), true);
});
