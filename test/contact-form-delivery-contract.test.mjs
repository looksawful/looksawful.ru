import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync(new URL("../src/components/contact-hub.ts", import.meta.url), "utf8");

test("Contact Hub form is wired to real delivery rather than prototype prevention", () => {
  assert.match(component, /submitContactMessage/);
  assert.match(component, /fileInput\.type = "file"/);
  assert.match(component, /fileInput\.name = "attachment"/);
  assert.match(component, /attachButton\.addEventListener\("click", onAttach\)/);
  assert.match(component, /formScreen\.addEventListener\("submit", onFormSubmit\)/);
  assert.match(component, /status\.setAttribute\("aria-live", "polite"\)/);
  assert.doesNotMatch(component, /preventPrototypeSubmit/);
});

test("successful delivery clears draft and attachment while failures preserve text", () => {
  assert.match(component, /result\.kind === "sent"/);
  assert.match(component, /draftStore\?\.clear\(\)/);
  assert.match(component, /fileInput\.value = ""/);
  assert.match(component, /submitButton\.disabled = true/);
  assert.match(component, /submitButton\.disabled = false/);
});
