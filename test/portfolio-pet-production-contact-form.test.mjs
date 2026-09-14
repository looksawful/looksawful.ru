import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const main = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const pet = fs.readFileSync(new URL("../src/components/portfolio-pet.ts", import.meta.url), "utf8");
const form = fs.readFileSync(
  new URL("../src/components/contact-form-hub.ts", import.meta.url),
  "utf8",
);

test("production mounts Awful and the contact-only window", () => {
  assert.match(main, /mountPortfolioPet\(document, \{ enabled: false \}\)/);
  assert.match(main, /mountContactFormHub\(document\)/);
  assert.match(pet, /data-portfolio-pet-launcher|dataset\.portfolioPetLauncher/);
  assert.match(pet, /data-portfolio-pet-dismiss|dataset\.portfolioPetDismiss/);
  assert.match(pet, /data-portfolio-pet-restore|dataset\.portfolioPetRestore/);
  assert.match(pet, /pointermove/);
});

test("production contact window contains no AI dialog or transport", () => {
  assert.match(form, /dataset\.contactFormHub/);
  assert.match(form, /dataset\.contactForm/);
  assert.match(form, /mailto:i@lookawful\.ru/);
  assert.doesNotMatch(main, /mountContactHub|portfolio-chat|assistant/i);
  assert.doesNotMatch(form, /portfolio-chat|assistant|contactHubAi|\bAI\b/i);
});
