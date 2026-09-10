import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const scripts = packageJson.scripts ?? {};

test("Stylelint baseline is pinned, correctness-only and non-blocking", async () => {
  const lintStyle = scripts["lint:style"];
  assert.equal(typeof lintStyle, "string", "missing npm script lint:style");
  assert.match(lintStyle, /stylelint@17\.15\.0/);
  assert.match(lintStyle, /src\/\*\*\/\*\.css/);

  for (const gate of ["verify", "verify:core", "verify:full", "test:fast"]) {
    assert.doesNotMatch(scripts[gate] ?? "", /lint:style/);
  }

  const { default: config } = await import("../stylelint.config.mjs");
  assert.equal(config.rules["property-no-unknown"], true);
  assert.equal(config.rules["unit-no-unknown"], true);
  assert.equal(config.rules["color-no-invalid-hex"], true);
  assert.equal(config.rules["at-rule-no-unknown"], true);
  assert.deepEqual(config.rules["selector-pseudo-class-no-unknown"], [
    true,
    { ignorePseudoClasses: ["target-current"] },
  ]);
  assert.equal(config.rules["selector-pseudo-element-no-unknown"], true);
  assert.equal(config.rules["media-feature-name-no-unknown"], true);
  assert.equal(config.rules["named-grid-areas-no-invalid"], true);
  assert.equal(config.extends, undefined);
});
