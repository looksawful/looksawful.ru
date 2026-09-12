import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync(new URL("../src/components/contact-hub.ts", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles/contact-hub.css", import.meta.url), "utf8");
const consentCss = fs.readFileSync(new URL("../src/styles/site-analytics-consent.css", import.meta.url), "utf8");

// P-001/P-003/P-007/P-008/P-009/AI-013: restore the approved v7 interaction surface
// without reintroducing prototype ownership or implicit cross-mode mutation.
test("Contact Hub restores the v7 shared AI/Form surface", () => {
  assert.match(component, /dataset\.contactHubMode/);
  assert.match(component, /createTextButton\(documentRef, "AI"\)/);
  assert.match(component, /createTextButton\(documentRef, "написать"\)/);
  assert.match(component, /dataset\.contactHubAiComposer/);
  assert.match(component, /dataset\.contactHubForm/);
  assert.match(component, /nameInput/);
  assert.match(component, /emailInput/);
  assert.match(component, /messageInput/);
  assert.match(component, /createTextButton\(documentRef, "\+ файл"\)/);
  assert.match(component, /textContent = "отправить"/);
});

test("AI composer preserves the approved v7 input language", () => {
  assert.match(component, /documentRef\.createElement\("input"\)/);
  assert.match(component, /placeholder = "спросить Venus"/);
  assert.match(component, /composerSend\.type = "submit"/);
  assert.match(component, /composerSend\.textContent = "↑"/);
  assert.match(component, /setAttribute\("aria-label", "Отправить"\)/);
});

test("mode switching is state-only and explicit handoff uses the canonical domain seam", () => {
  assert.match(component, /applyExplicitAiDraftHandoff/);
  assert.match(component, /transitionContactHub\(state, \{ type: "SET_MODE", mode \}\)/);
  assert.match(component, /setMode\("ai"\)/);
  assert.match(component, /setMode\("form"\)/);
  assert.match(component, /commitHandoff\(pendingDraft, "append"\)/);
  assert.match(component, /commitHandoff\(pendingDraft, "replace"\)/);
  assert.match(component, /needs_message_decision/);
  assert.match(component, /kind === "ready"/);
  assert.doesNotMatch(component, /\.requestSubmit\(/);
});

test("v7 visual contract stays compact beside Venus on desktop", () => {
  assert.match(css, /inset-inline-start:\s*214px/);
  assert.match(css, /inset-block-end:\s*18px/);
  assert.match(css, /inline-size:\s*min\(356px,\s*calc\(100vw - 236px\)\)/);
  assert.match(css, /block-size:\s*min\(464px,\s*calc\(100dvh - 36px\)\)/);
  assert.match(css, /grid-template-rows:\s*auto 1fr auto/);
  assert.match(css, /overflow:\s*hidden/);
});

test("v7 form uses stacked editorial rows rather than a two-column field grid", () => {
  assert.match(css, /\.contact-hub__field\s*\{[\s\S]*display:\s*grid;[\s\S]*gap:\s*3px;/);
  assert.doesNotMatch(css, /grid-template-columns:\s*minmax\(5rem/);
  assert.match(css, /\.contact-hub__field:focus-within/);
});

test("v7 mobile shell is a 62dvh bottom sheet", () => {
  assert.match(css, /@media \(width <= 42\.5rem\)/);
  assert.match(css, /block-size:\s*min\(62dvh,\s*520px\)/);
  assert.match(css, /max-block-size:\s*calc\(100dvh - env\(safe-area-inset-top\)\)/);
  assert.match(css, /padding-block-end:\s*env\(safe-area-inset-bottom\)/);
  assert.doesNotMatch(css, /backdrop-filter/);
  assert.doesNotMatch(css, /100vh/);
});

test("mobile collapse and restore are wired without clearing form draft", () => {
  assert.match(component, /dataset\.contactHubCollapse/);
  assert.match(component, /dataset\.contactHubLauncher/);
  assert.match(component, /transitionContactHub\(state, \{ type: "COLLAPSE" \}\)/);
  assert.match(component, /transitionContactHub\(state, \{ type: "RESTORE" \}\)/);
  assert.doesNotMatch(component, /nameInput\.value\s*=\s*""/);
  assert.doesNotMatch(component, /emailInput\.value\s*=\s*""/);
  assert.doesNotMatch(component, /messageInput\.value\s*=\s*""/);
});

test("visible mobile consent is moved clear of the bottom sheet", () => {
  assert.match(component, /documentElement\.classList\.toggle\("contact-hub-open"/);
  assert.match(consentCss, /@media \(max-width: 42\.5rem\)/);
  assert.match(consentCss, /html\.contact-hub-open \.site-analytics-consent/);
  assert.match(consentCss, /inset-block-end:\s*calc\(\s*min\(62dvh,\s*520px\)/);
});
