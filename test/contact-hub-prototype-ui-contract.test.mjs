import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync(new URL("../src/components/contact-hub.ts", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/contact-hub.css", import.meta.url), "utf8");

// P-001/P-003/P-007/P-008/P-009/AI-013: restore the approved v7 interaction surface
// without reintroducing prototype ownership or implicit cross-mode mutation.
test("Contact Hub restores the v7 shared AI/Form surface", () => {
  assert.match(component, /data\.contactHubMode/);
  assert.match(component, /textContent = "AI"/);
  assert.match(component, /textContent = "написать"/);
  assert.match(component, /dataset\.contactHubAiComposer/);
  assert.match(component, /dataset\.contactHubForm/);
  assert.match(component, /nameInput/);
  assert.match(component, /emailInput/);
  assert.match(component, /messageInput/);
  assert.match(component, /textContent = "\+ файл"/);
  assert.match(component, /textContent = "отправить"/);
});

test("mode switching is state-only and explicit handoff uses the canonical domain seam", () => {
  assert.match(component, /applyExplicitAiDraftHandoff/);
  assert.match(component, /transitionContactHub\(state, \{ type: "SET_MODE", mode: "ai" \}\)/);
  assert.match(component, /transitionContactHub\(state, \{ type: "SET_MODE", mode: "form" \}\)/);
  assert.match(component, /messageStrategy: "append"/);
  assert.match(component, /messageStrategy: "replace"/);
  assert.match(component, /needs_message_decision/);
  assert.match(component, /kind === "ready"/);
  assert.doesNotMatch(component, /\.requestSubmit\(/);
});

test("v7 visual contract stays compact on desktop and bottom-sheet based on mobile", () => {
  assert.match(css, /\.contact-hub__modes/);
  assert.match(css, /\.contact-hub__composer/);
  assert.match(css, /\.contact-hub__field/);
  assert.match(css, /100dvh/);
  assert.doesNotMatch(css, /backdrop-filter/);
  assert.doesNotMatch(css, /100vh/);
});
