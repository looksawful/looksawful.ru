import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const stateUrl = new URL("../src/features/contact-hub/state.ts", import.meta.url);
const formUrl = new URL("../src/features/contact-hub/form-contract.ts", import.meta.url);
const contextUrl = new URL("../src/features/contact-hub/context.ts", import.meta.url);

async function loadRequired(url, label) {
  assert.equal(existsSync(url), true, `RED: ${label} is not implemented yet`);
  return import(url.href);
}

test("P-001/P-003: entry points resolve into one shared Hub with direct form independent from AI", async () => {
  const { createContactHubState, transitionContactHub } = await loadRequired(stateUrl, "Contact Hub state contract");

  const initial = createContactHubState({ aiAvailable: false });
  const fromCta = transitionContactHub(initial, { type: "OPEN", entryPoint: "site-contact" });
  assert.equal(fromCta.visibility, "open");
  assert.equal(fromCta.mode, "form");

  const closedAgain = transitionContactHub(fromCta, { type: "CLOSE" });
  const fromPet = transitionContactHub(closedAgain, { type: "OPEN", entryPoint: "pet" });
  assert.equal(fromPet.visibility, "open");
  assert.equal(fromPet.mode, "ai");
  assert.equal(fromPet.aiAvailable, false);

  const directFromPet = transitionContactHub(closedAgain, { type: "OPEN", entryPoint: "pet-direct" });
  assert.equal(directFromPet.mode, "form");
});

test("P-004/M-010: mode switching and mobile collapse preserve one logical Hub state", async () => {
  const { createContactHubState, transitionContactHub } = await loadRequired(stateUrl, "Contact Hub state contract");

  let state = createContactHubState({ aiAvailable: true });
  state = transitionContactHub(state, { type: "OPEN", entryPoint: "pet" });
  assert.equal(state.mode, "ai");
  state = transitionContactHub(state, { type: "SET_MODE", mode: "form" });
  assert.equal(state.mode, "form");
  assert.equal(state.visibility, "open");
  state = transitionContactHub(state, { type: "COLLAPSE" });
  assert.equal(state.visibility, "collapsed");
  assert.equal(state.mode, "form");
  state = transitionContactHub(state, { type: "RESTORE" });
  assert.equal(state.visibility, "open");
  assert.equal(state.mode, "form");
});

test("F-003/F-004/F-005/F-010: form validation protects the user-facing submission contract", async () => {
  const { CONTACT_MESSAGE_MAX_LENGTH, validateContactFormDraft } = await loadRequired(formUrl, "Contact form validation contract");
  assert.equal(CONTACT_MESSAGE_MAX_LENGTH, 5000);

  assert.deepEqual(validateContactFormDraft({ name: "", email: "person@example.com", message: "Привет" }), {});
  assert.deepEqual(validateContactFormDraft({ name: "Иван", email: " person@example.com ", message: "Привет" }), {});

  const noEmail = validateContactFormDraft({ name: "", email: "", message: "Привет" });
  assert.equal(typeof noEmail.email, "string");

  const invalidEmail = validateContactFormDraft({ name: "", email: "not-an-email", message: "Привет" });
  assert.equal(typeof invalidEmail.email, "string");

  const noMessage = validateContactFormDraft({ name: "", email: "person@example.com", message: "   " });
  assert.equal(typeof noMessage.message, "string");

  const tooLong = validateContactFormDraft({
    name: "",
    email: "person@example.com",
    message: "x".repeat(CONTACT_MESSAGE_MAX_LENGTH + 1),
  });
  assert.equal(typeof tooLong.message, "string");
});

test("PRV-004/PRV-005: shared ContactContext strips PII and message content", async () => {
  const { buildSharedContactContext } = await loadRequired(contextUrl, "safe shared ContactContext contract");
  const context = buildSharedContactContext({
    currentPath: "/work/jestei/",
    language: "ru",
    entryPoint: "site-contact",
    activeMode: "form",
    name: "Sensitive Name",
    email: "private@example.com",
    message: "private message",
    filename: "private.pdf",
  });

  assert.deepEqual(context, {
    currentPath: "/work/jestei/",
    language: "ru",
    entryPoint: "site-contact",
    activeMode: "form",
  });
  for (const forbidden of ["name", "email", "message", "filename", "ip", "fingerprint", "webvisorId"]) {
    assert.equal(Object.hasOwn(context, forbidden), false, `shared context must not contain ${forbidden}`);
  }
});
