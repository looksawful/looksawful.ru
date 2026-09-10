import assert from "node:assert/strict";
import test from "node:test";

import { collectToolchainReport } from "../tools/ci/toolchain-doctor.mjs";

test("toolchain doctor reports required environment layers without installing them", async () => {
  const report = await collectToolchainReport({ launchBrowser: false });

  assert.equal(report.schemaVersion, 1);
  assert.match(report.node.version, /^v\d+\./);
  assert.equal(report.node.expectedEngine, "24.x");
  assert.equal(typeof report.npm.available, "boolean");
  assert.equal(typeof report.playwright.package.available, "boolean");
  assert.equal(typeof report.playwright.chromium.installed, "boolean");
  assert.equal(report.playwright.chromium.launch, "not_checked");
  assert.equal(typeof report.ffmpeg.available, "boolean");
  assert.equal(typeof report.ffprobe.available, "boolean");
});

test("toolchain doctor keeps browser launch explicit and read-only", async () => {
  const report = await collectToolchainReport({ launchBrowser: false });

  assert.notEqual(report.playwright.chromium.launch, "ok");
  assert.notEqual(report.playwright.chromium.launch, "failed");
});

test("toolchain doctor exposes FFmpeg and ffprobe build identity when available", async () => {
  const report = await collectToolchainReport({ launchBrowser: false });

  for (const tool of [report.ffmpeg, report.ffprobe]) {
    assert.ok(Object.hasOwn(tool, "builtWith"));
    assert.ok(Object.hasOwn(tool, "configuration"));
    if (tool.available) {
      assert.equal(typeof tool.builtWith, "string");
      assert.equal(typeof tool.configuration, "string");
      assert.match(tool.builtWith, /^built with /);
      assert.match(tool.configuration, /^configuration:/);
    } else {
      assert.equal(tool.builtWith, null);
      assert.equal(tool.configuration, null);
    }
  }
});
