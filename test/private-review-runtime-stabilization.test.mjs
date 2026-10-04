import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DEFAULT_REVIEW_SEED,
  DEFAULT_REVIEW_TIME,
  REVIEW_CAPTURE_TIMEOUT_MS,
  classifyReviewRequest,
  createDeterministicCaptureStyle,
  normalizeDeterministicOptions,
} from "../tools/review/runtime.mjs";

test("deterministic review options pin seed, wall clock and bounded readiness", () => {
  assert.equal(DEFAULT_REVIEW_SEED, 1087);
  assert.equal(DEFAULT_REVIEW_TIME, "2026-01-01T12:00:00.000Z");
  assert.ok(REVIEW_CAPTURE_TIMEOUT_MS >= 1_000 && REVIEW_CAPTURE_TIMEOUT_MS <= 30_000);

  assert.deepEqual(
    normalizeDeterministicOptions({
      seed: 42,
      fixedTime: "2026-09-22T09:30:00Z",
      timeoutMs: 5_000,
    }),
    {
      seed: 42,
      fixedTime: "2026-09-22T09:30:00.000Z",
      fixedEpochMs: Date.parse("2026-09-22T09:30:00Z"),
      timeoutMs: 5_000,
    },
  );

  assert.throws(() => normalizeDeterministicOptions({ seed: 1.5 }), /seed/i);
  assert.throws(() => normalizeDeterministicOptions({ fixedTime: "tomorrow-ish" }), /time/i);
  assert.throws(() => normalizeDeterministicOptions({ timeoutMs: 0 }), /timeout/i);
});

test("deterministic capture network is same-origin and fails closed for external HTTP", () => {
  const baseUrl = "http://127.0.0.1:4173/";

  assert.equal(classifyReviewRequest("http://127.0.0.1:4173/app.js", baseUrl), "allow");
  assert.equal(classifyReviewRequest("http://127.0.0.1:4173/media/a.webp", baseUrl), "allow");
  assert.equal(classifyReviewRequest("data:image/png;base64,AA==", baseUrl), "allow");
  assert.equal(classifyReviewRequest("blob:http://127.0.0.1:4173/id", baseUrl), "allow");
  assert.equal(classifyReviewRequest("about:blank", baseUrl), "allow");
  assert.equal(classifyReviewRequest("https://example.com/track.js", baseUrl), "abort");
  assert.equal(classifyReviewRequest("https://fonts.example.org/font.woff2", baseUrl), "abort");
});

test("deterministic CSS freezes visual motion without hiding content", () => {
  const style = createDeterministicCaptureStyle();

  assert.match(style, /animation-play-state:\s*paused/i);
  assert.match(style, /animation-duration:\s*0s/i);
  assert.match(style, /transition-duration:\s*0s/i);
  assert.match(style, /scroll-behavior:\s*auto/i);
  assert.match(style, /caret-color:\s*transparent/i);
  assert.doesNotMatch(style, /display:\s*none/i);
  assert.doesNotMatch(style, /visibility:\s*hidden/i);
});

test("capture runtime contains no arbitrary sleep primitive", async () => {
  const source = await readFile(new URL("../tools/review/runtime.mjs", import.meta.url), "utf8");

  assert.doesNotMatch(source, /\.waitForTimeout\s*\(/);
  assert.doesNotMatch(source, /\bsetTimeout\s*\(/);
  assert.match(source, /document\.fonts/);
  assert.match(source, /naturalWidth/);
  assert.match(source, /readyState/);
  assert.match(source, /data-model-state|attribute/);
});


test("deterministic capture style settles review reveals without changing production motion", () => {
  const style = createDeterministicCaptureStyle();

  assert.match(style, /data-review-capture=["']deterministic["'][^}]*data-reveal/is);
  assert.match(style, /opacity:\s*1\s*!important/i);
  assert.match(style, /visibility:\s*visible\s*!important/i);
  assert.match(style, /transform:\s*none\s*!important/i);
  assert.match(style, /translate:\s*none\s*!important/i);
  assert.match(style, /scale:\s*none\s*!important/i);
});

test("review browser smoke stays affected-only and never publishes visual evidence", async () => {
  const [smoke, workflow] = await Promise.all([
    readFile(new URL("../tools/review/smoke-runtime-matrix.mjs", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/private-review-runtime.yml", import.meta.url), "utf8"),
  ]);

  assert.match(smoke, /chromium/);
  assert.match(smoke, /webkit/);
  assert.match(smoke, /runtime-smoke/);
  assert.match(smoke, /technical-smoke/);
  assert.match(smoke, /buildReviewRuntimeMatrix/);
  assert.match(smoke, /openReviewPage/);
  assert.match(smoke, /dynamicStates/);
  assert.match(smoke, /kind:\s*"canvas"/);
  assert.match(smoke, /kind:\s*"webgl"/);
  assert.match(smoke, /kind:\s*"infinite-gallery"/);
  assert.match(smoke, /kind:\s*"video"/);
  assert.match(smoke, /prepareDynamicReviewStates/);
  assert.match(smoke, /data-reveal/);
  assert.match(smoke, /getComputedStyle/);

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /tools\/review\/\*\*/);
  assert.doesNotMatch(workflow, /src\/motion\.ts/);
  assert.match(workflow, /playwright install --with-deps --only-shell chromium/);
  assert.match(workflow, /playwright install --with-deps webkit/);
  assert.match(workflow, /node tools\/review\/smoke-runtime-matrix\.mjs/);
  assert.doesNotMatch(workflow, /upload-artifact|deploy|pages|secrets\./i);
});
