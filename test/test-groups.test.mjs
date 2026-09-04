import assert from "node:assert/strict";
import test from "node:test";
import { fastTests, selectTests } from "../tools/ci/run-tests.mjs";

test("fast tests are opt-in contracts while broad cheap coverage stays available outside push CI", () => {
  const files = [
    "test/css-fixes/responsive-css.test.mjs",
    "test/media-tools/video-builder.test.mjs",
    "test/responsive-manifest-contract.test.mjs",
    "test/before-after-migration.test.mjs",
    "test/new-widget-regression.test.mjs",
    "test/cms-publication-scope.test.mjs",
    "test/test-groups.test.mjs",
  ];

  assert.deepEqual(selectTests("fast", files), [
    "test/cms-publication-scope.test.mjs",
  ]);

  assert.deepEqual(selectTests("unit", files), [
    "test/before-after-migration.test.mjs",
    "test/cms-publication-scope.test.mjs",
    "test/css-fixes/responsive-css.test.mjs",
    "test/new-widget-regression.test.mjs",
    "test/test-groups.test.mjs",
  ]);

  assert.deepEqual(selectTests("media", files), [
    "test/media-tools/video-builder.test.mjs",
    "test/responsive-manifest-contract.test.mjs",
  ]);

  assert.equal(fastTests.has("test/new-widget-regression.test.mjs"), false);
  assert.equal(fastTests.has("test/before-after-migration.test.mjs"), false);
  assert.equal(fastTests.has("test/cms-publication-scope.test.mjs"), true);
  assert.throws(() => selectTests("invalid", files), /unknown test group/);
});
