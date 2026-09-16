import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const handoff = fs.readFileSync(new URL("../src/components/contact-hub-direct-handoff.ts", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/contact-hub-minimal.css", import.meta.url), "utf8");

test("pet-opened Hub is re-anchored using the rendered minimal surface size", () => {
  assert.match(handoff, /portfolio-pet:moved/);
  assert.match(handoff, /MutationObserver/);
  assert.match(handoff, /getBoundingClientRect\(\)/);
  assert.match(handoff, /visualViewport/);
  assert.match(handoff, /hub\.style\.inlineSize/);
  assert.match(handoff, /hub\.style\.insetBlockStart/);
});

test("minimal width beats the legacy inline AI width while preserving responsive bounds", () => {
  assert.match(css, /\.contact-hub\s*\{[\s\S]*inline-size:\s*min\(328px,[^;]+\)\s*!important;/);
});
