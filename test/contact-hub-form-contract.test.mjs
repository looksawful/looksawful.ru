import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const formUrl = new URL("../src/features/contact-hub/form-contract.ts", import.meta.url);

async function loadFormContract() {
  assert.equal(
    existsSync(formUrl),
    true,
    "RED: Contact Hub form contract is not implemented on current dev",
  );
  return import(formUrl.href);
}

test("contact form requires a valid email and a bounded non-empty message", async () => {
  const {
    CONTACT_MESSAGE_MAX_LENGTH,
    normalizeContactFormDraft,
    validateContactFormDraft,
  } = await loadFormContract();

  assert.equal(CONTACT_MESSAGE_MAX_LENGTH, 5000);

  assert.deepEqual(
    normalizeContactFormDraft({
      name: " Иван ",
      email: " person@example.com ",
      message: "  Привет  ",
    }),
    {
      name: "Иван",
      email: "person@example.com",
      message: "  Привет  ",
    },
  );

  assert.deepEqual(
    validateContactFormDraft({
      name: "",
      email: "person@example.com",
      message: "Привет",
    }),
    {},
  );

  assert.equal(
    validateContactFormDraft({ name: "", email: "", message: "Привет" }).email,
    "required",
  );
  assert.equal(
    validateContactFormDraft({ name: "", email: "not-an-email", message: "Привет" }).email,
    "invalid",
  );
  assert.equal(
    validateContactFormDraft({ name: "", email: "person@example.com", message: "   " }).message,
    "required",
  );
  assert.equal(
    validateContactFormDraft({
      name: "",
      email: "person@example.com",
      message: "x".repeat(CONTACT_MESSAGE_MAX_LENGTH + 1),
    }).message,
    "too-long",
  );
});
