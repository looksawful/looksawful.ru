import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("../src/styles/contact-hub-minimal.css", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

test("Contact Hub presentation is flatter and uses one desktop width", () => {
  assert.match(css, /\.contact-hub\s*\{[\s\S]*inline-size:\s*min\(328px,/);
  assert.match(css, /\.contact-hub\s*\{[\s\S]*border-radius:\s*10px;/);
  assert.match(css, /\.contact-hub\s*\{[\s\S]*box-shadow:\s*none;/);
  assert.match(css, /\.contact-hub\[data-mode="form"\][\s\S]*block-size:\s*min\(344px,/);
});

test("AI starts compact and expands only after a user message", () => {
  assert.match(css, /data-mode="ai"[^\n]*:not\(:has\(\.contact-hub__message--user\)\)[\s\S]*block-size:\s*min\(208px,/);
  assert.match(css, /data-mode="ai"[^\n]*:has\(\.contact-hub__message--user\)[\s\S]*block-size:\s*min\(404px,/);
  assert.match(css, /\.contact-hub__ai-log\s*\{[\s\S]*overflow-y:\s*auto;/);
});

test("form stays editorial instead of app-like", () => {
  assert.match(css, /\.contact-hub__field :is\(input, textarea\)\s*\{[\s\S]*border-block-end:/);
  assert.match(css, /\.contact-hub__field textarea\s*\{[\s\S]*border-block-end:\s*0;/);
  assert.doesNotMatch(css, /backdrop-filter/);
});

test("minimal presentation is loaded after base Contact Hub styles", () => {
  const baseIndex = main.indexOf("./styles/contact-hub.css");
  const minimalIndex = main.indexOf("./styles/contact-hub-minimal.css");
  assert.ok(baseIndex >= 0 && minimalIndex > baseIndex);
});
