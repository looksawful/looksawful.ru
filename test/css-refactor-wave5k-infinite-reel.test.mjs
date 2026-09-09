import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fastTests } from "../tools/ci/run-tests.mjs";

const media = readFileSync(new URL("../src/styles/media.css", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const motion = readFileSync(new URL("../src/styles/motion.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("../src/components/infinite-reel.ts", import.meta.url), "utf8");
const renderer = readFileSync(new URL("../src/templates/media-group.ts", import.meta.url), "utf8");

const reelOwner = /(?:^|\n)\[data-infinite-reel\]\s*\{/;
const reelKeyframes = /@keyframes\s+infinite-reel-scroll\s*\{/;
const fadeFallback = "var(--infinite-reel-fade-size, clamp(2rem, 7cqi, 6rem))";

test("Wave5K gives infinite-reel structure one canonical media owner", () => {
  assert.match(media, reelOwner);
  assert.doesNotMatch(components, reelOwner);
  assert.match(
    media,
    /\[data-infinite-reel\]\s*\{[\s\S]*?--infinite-reel-gap:\s*var\(--group-gap,\s*var\(--size-300\)\);[\s\S]*?--infinite-reel-duration:\s*30s;[\s\S]*?min-inline-size:\s*0;/,
  );
  assert.doesNotMatch(media, /--infinite-reel-fade-size\s*:/, "generic media owner must not overwrite the authored fade input");
  assert.equal(media.split(fadeFallback).length - 1, 4, "media mask consumers must keep the accepted fade fallback contract");
});

test("Wave5K keeps animated reel geometry and masking in media ownership", () => {
  assert.match(
    media,
    /\[data-infinite-reel\][\s\S]*?\&\[data-animated="true"\]\s*\{[\s\S]*?overflow-x:\s*clip;[\s\S]*?overflow-y:\s*visible;[\s\S]*?mask-image:\s*linear-gradient/,
  );
  assert.match(
    media,
    /\&\s*>\s*\[data-infinite-reel-track\]\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*nowrap;[\s\S]*?align-items:\s*flex-start;[\s\S]*?justify-content:\s*flex-start;[\s\S]*?gap:\s*var\(--infinite-reel-gap\);[\s\S]*?inline-size:\s*max-content;[\s\S]*?max-inline-size:\s*none;[\s\S]*?overflow:\s*visible;[\s\S]*?scroll-snap-type:\s*none;[\s\S]*?\&\s*>\s*\.media\s*\{[\s\S]*?flex:\s*0 0 auto;/,
  );
  assert.doesNotMatch(media, /animation:\s*infinite-reel-scroll/);
  assert.doesNotMatch(media, reelKeyframes);
  assert.doesNotMatch(media, /animation-play-state:/);
  assert.doesNotMatch(media, /--infinite-reel-speed\s*:/);
});

test("Wave5K keeps infinite-reel motion lifecycle in the motion owner", () => {
  assert.match(motion, /\[data-infinite-reel\]\s*\{[\s\S]*?--infinite-reel-speed:\s*var\(--motion-speed-autoscroll\);/);
  assert.match(
    motion,
    /\[data-infinite-reel\]\[data-animated="true"\]\s*>\s*\[data-infinite-reel-track\]\s*\{[\s\S]*?animation:\s*infinite-reel-scroll var\(--infinite-reel-duration\) linear infinite;[\s\S]*?animation-play-state:\s*paused;[\s\S]*?will-change:\s*auto;/,
  );
  assert.match(
    motion,
    /\[data-infinite-reel\]\[data-animated="true"\]\[data-infinite-reel-active\][\s\S]*?>\s*\[data-infinite-reel-track\]\s*\{[\s\S]*?animation-play-state:\s*running;[\s\S]*?will-change:\s*transform;/,
  );
  assert.match(motion, reelKeyframes);
  assert.match(motion, /translate3d\(calc\(-50% - \(var\(--infinite-reel-gap\) \/ 2\)\),\s*0,\s*0\)/);
  assert.doesNotMatch(components, reelKeyframes);
});

test("Wave5K preserves runtime and authored duration boundaries", () => {
  for (const pattern of [
    /export function createInfiniteReel\(/,
    /new IntersectionObserver\(/,
    /new ResizeObserver\(/,
    /document\.addEventListener\("visibilitychange"/,
    /motion\?\.subscribe/,
    /data-infinite-reel-clone/,
    /data-infinite-reel-active/,
    /DURATION_PROPERTY = "--infinite-reel-duration"/,
  ]) {
    assert.match(runtime, pattern);
  }
  assert.match(renderer, /pushVariable\(variables,\s*"--infinite-reel-duration",\s*data\.infiniteReel\?\.duration\);/);
  assert.match(renderer, /data-infinite-reel-track/);
});

test("Wave5K stops before Slider ownership", () => {
  assert.match(components, /Slider and magazine — interaction without motion/);
  assert.match(components, /(?:^|\n)\.slider\s*\{/);
  assert.doesNotMatch(media, /(?:^|\n)\.slider\s*\{/);
});

test("Wave5K infinite-reel split ownership contract is mandatory in Fast CI", () => {
  assert.equal(fastTests.has("test/css-refactor-wave5k-infinite-reel.test.mjs"), true);
});
