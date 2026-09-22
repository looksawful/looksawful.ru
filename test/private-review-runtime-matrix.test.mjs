import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_REVIEW_PROFILES,
  REVIEW_BROWSER_ROLES,
  buildReviewRuntimeMatrix,
  validateDynamicReviewState,
} from "../tools/review/runtime-matrix.mjs";

const profileIds = CANONICAL_REVIEW_PROFILES.map((profile) => profile.id);

test("private review exposes one deterministic canonical profile registry", () => {
  assert.deepEqual(profileIds, [
    "iphone-17",
    "ipad-air-11-portrait",
    "desktop-1440",
    "ultrawide-3440",
  ]);

  assert.deepEqual(
    CANONICAL_REVIEW_PROFILES.map(({ id, width, height }) => ({ id, width, height })),
    [
      { id: "iphone-17", width: 390, height: 844 },
      { id: "ipad-air-11-portrait", width: 834, height: 1112 },
      { id: "desktop-1440", width: 1440, height: 900 },
      { id: "ultrawide-3440", width: 3440, height: 1440 },
    ],
  );

  assert.equal(REVIEW_BROWSER_ROLES.chromium, "canonical-baseline");
  assert.equal(REVIEW_BROWSER_ROLES.webkit, "technical-smoke");
});

test("full review keeps Chromium canonical and WebKit Apple-only technical smoke", () => {
  const matrix = buildReviewRuntimeMatrix({ reviewDepth: "full" });

  const captures = matrix.filter((row) => row.phase === "capture");
  assert.deepEqual([...new Set(captures.map((row) => row.browser))], ["chromium"]);
  assert.deepEqual([...new Set(captures.map((row) => row.profileId))], profileIds);
  assert.ok(captures.every((row) => row.baseline === true && row.deterministic === true));

  const webkit = matrix.filter((row) => row.browser === "webkit");
  assert.deepEqual(
    [...new Set(webkit.map((row) => row.profileId))],
    ["iphone-17", "ipad-air-11-portrait"],
  );
  assert.ok(webkit.every((row) => row.phase === "technical-smoke"));
  assert.ok(webkit.every((row) => row.baseline === false && row.captureKinds.length === 0));
});

test("motion evidence duplicates only the capture kind with material difference", () => {
  const matrix = buildReviewRuntimeMatrix({
    reviewDepth: "quick",
    affectedProfiles: ["desktop-1440"],
    motionDifference: {
      viewport: true,
      fullPage: false,
    },
  });

  const captures = matrix.filter((row) => row.phase === "capture");
  const normal = captures.find((row) => row.motion === "no-preference");
  const reduced = captures.find((row) => row.motion === "reduce");

  assert.deepEqual(normal?.captureKinds, ["viewport", "full-page"]);
  assert.deepEqual(reduced?.captureKinds, ["viewport"]);
  assert.equal(
    captures.some((row) => row.motion === "reduce" && row.captureKinds.includes("full-page")),
    false,
  );
});

test("review depth remains conservative when affected profile routing is absent", () => {
  const quick = buildReviewRuntimeMatrix({ reviewDepth: "quick" });
  assert.deepEqual(
    [...new Set(quick.filter((row) => row.phase === "capture").map((row) => row.profileId))],
    ["desktop-1440"],
  );

  const interactive = buildReviewRuntimeMatrix({ reviewDepth: "interactive" });
  assert.deepEqual(
    [...new Set(interactive.filter((row) => row.phase === "capture").map((row) => row.profileId))],
    profileIds,
  );

  assert.equal(
    quick.some((row) => row.browser === "webkit"),
    false,
    "Quick evidence does not pay the cross-engine smoke cost",
  );
  assert.equal(
    interactive.some((row) => row.browser === "webkit"),
    true,
    "Interactive review includes Apple technical smoke",
  );
});

test("normal runtime smoke stays separate from deterministic capture", () => {
  const matrix = buildReviewRuntimeMatrix({
    reviewDepth: "full",
    motionDifference: { viewport: true, fullPage: true },
  });

  const runtimeSmoke = matrix.filter((row) => row.phase === "runtime-smoke");
  assert.deepEqual([...new Set(runtimeSmoke.map((row) => row.browser))], ["chromium"]);
  assert.ok(runtimeSmoke.every((row) => row.motion === "no-preference"));
  assert.ok(runtimeSmoke.every((row) => row.deterministic === false));
  assert.ok(runtimeSmoke.every((row) => row.captureKinds.length === 0));
});

test("dynamic review state contracts reject implicit canvas/WebGL/gallery stability", () => {
  assert.throws(
    () => validateDynamicReviewState({
      id: "hero-canvas",
      kind: "canvas",
      selector: "[data-animated-canvas-gallery]",
    }),
    /ready.*stable|stable.*ready/i,
  );

  assert.throws(
    () => validateDynamicReviewState({
      id: "device-model",
      kind: "webgl",
      selector: "[data-model-viewer-runtime]",
      ready: { attribute: "data-model-state", value: "ready" },
    }),
    /stable/i,
  );

  assert.deepEqual(
    validateDynamicReviewState({
      id: "device-model",
      kind: "webgl",
      selector: "[data-model-viewer-runtime]",
      ready: { attribute: "data-model-state", value: "ready" },
      stable: { attribute: "data-model-state", value: "ready" },
    }),
    {
      id: "device-model",
      kind: "webgl",
      selector: "[data-model-viewer-runtime]",
      ready: { attribute: "data-model-state", value: "ready" },
      stable: { attribute: "data-model-state", value: "ready" },
    },
  );

  assert.deepEqual(
    validateDynamicReviewState({
      id: "intro-video",
      kind: "video",
      selector: "video[data-review-intro]",
      time: 0,
    }),
    {
      id: "intro-video",
      kind: "video",
      selector: "video[data-review-intro]",
      time: 0,
    },
  );
});
