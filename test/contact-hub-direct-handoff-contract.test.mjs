import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const handoff = fs.readFileSync(new URL("../src/components/contact-hub-direct-handoff.ts", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/contact-hub-minimal.css", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

test("AI conversation exposes one contextual direct-contact handoff", () => {
  assert.match(handoff, /data-contact-hub-ai/);
  assert.match(handoff, /dataContactHubDirectContact/);
  assert.match(handoff, /написать напрямую/);
  assert.match(handoff, /siteContact\.click\(\)/);
});

test("handoff stays out of the compact prompt and below the scrollable conversation", () => {
  assert.match(css, /\.contact-hub__screen--ai\s*\{[\s\S]*display:\s*grid;[\s\S]*grid-template-rows:\s*1fr auto;/);
  assert.match(css, /not\(:has\(\.contact-hub__message--user\)\)[\s\S]*\.contact-hub__direct-contact[\s\S]*display:\s*none;/);
});

test("handoff lifecycle is mounted after Contact Hub and cleaned up", () => {
  assert.match(main, /mountContactHubDirectHandoff/);
  assert.match(main, /const destroyContactHubDirectHandoff = mountContactHubDirectHandoff/);
  assert.match(main, /destroyContactHub,[\s\S]*destroyContactHubDirectHandoff/);
});
