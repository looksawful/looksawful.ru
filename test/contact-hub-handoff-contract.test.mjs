import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const handoffUrl = new URL("../src/features/contact-hub/handoff.ts", import.meta.url);

async function loadHandoff() {
  assert.equal(existsSync(handoffUrl), true, "RED: explicit AI-to-form handoff is not implemented yet");
  return import(handoffUrl.href);
}

const existingDraft = Object.freeze({
  name: "Visitor",
  email: "visitor@example.com",
  message: "",
});

test("P-007/P-008/P-009/AI-013: explicit handoff transfers only selected draft text and preserves form identity", async () => {
  const { applyExplicitAiDraftHandoff } = await loadHandoff();
  const result = applyExplicitAiDraftHandoff({
    selectedDraftText: "Prepared AI draft",
    formDraft: existingDraft,
  });

  assert.deepEqual(result, {
    kind: "ready",
    draft: {
      name: "Visitor",
      email: "visitor@example.com",
      message: "Prepared AI draft",
    },
  });
  assert.equal(Object.hasOwn(result, "submit"), false);
  assert.equal(Object.hasOwn(result, "history"), false);
});

test("P-009: existing non-empty form message requires an explicit merge or replace decision", async () => {
  const { applyExplicitAiDraftHandoff } = await loadHandoff();
  const result = applyExplicitAiDraftHandoff({
    selectedDraftText: "Incoming draft",
    formDraft: { ...existingDraft, message: "Existing message" },
  });

  assert.deepEqual(result, {
    kind: "needs_message_decision",
    currentMessage: "Existing message",
    incomingMessage: "Incoming draft",
  });
});

test("P-009: explicit append and replace decisions remain editable form drafts and never submit", async () => {
  const { applyExplicitAiDraftHandoff } = await loadHandoff();
  const formDraft = { ...existingDraft, message: "Existing message" };

  const appended = applyExplicitAiDraftHandoff({
    selectedDraftText: "Incoming draft",
    formDraft,
    messageStrategy: "append",
  });
  assert.deepEqual(appended, {
    kind: "ready",
    draft: { ...formDraft, message: "Existing message\n\nIncoming draft" },
  });

  const replaced = applyExplicitAiDraftHandoff({
    selectedDraftText: "Incoming draft",
    formDraft,
    messageStrategy: "replace",
  });
  assert.deepEqual(replaced, {
    kind: "ready",
    draft: { ...formDraft, message: "Incoming draft" },
  });
  assert.equal(Object.hasOwn(appended, "submit"), false);
  assert.equal(Object.hasOwn(replaced, "submit"), false);
});

test("P-009: blank selected draft cannot trigger a form handoff", async () => {
  const { applyExplicitAiDraftHandoff } = await loadHandoff();
  assert.deepEqual(applyExplicitAiDraftHandoff({
    selectedDraftText: "   ",
    formDraft: existingDraft,
  }), { kind: "no_draft" });
});
