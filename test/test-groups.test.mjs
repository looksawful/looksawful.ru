import assert from "node:assert/strict";
import test from "node:test";
import { selectTests } from "../tools/ci/run-tests.mjs";

test("fast tests keep nested CSS coverage but defer physical derivatives and ffmpeg fixtures", () => {
  const files = ["test/css-fixes/responsive-css.test.mjs", "test/media-tools/video-builder.test.mjs", "test/responsive-manifest-contract.test.mjs", "test/cv-cms.test.mjs"];
  assert.deepEqual(selectTests("fast", files), ["test/css-fixes/responsive-css.test.mjs", "test/cv-cms.test.mjs"]);
  assert.deepEqual(selectTests("media", files), ["test/media-tools/video-builder.test.mjs", "test/responsive-manifest-contract.test.mjs"]);
  assert.throws(() => selectTests("invalid", files), /unknown test group/);
});
