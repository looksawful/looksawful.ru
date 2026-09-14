import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const main = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const pet = fs.readFileSync(new URL("../src/components/portfolio-pet.ts", import.meta.url), "utf8");
const productionE2E = fs.readFileSync(new URL("../tools/e2e/run-portfolio-pet-production.mjs", import.meta.url), "utf8");
const form = fs.readFileSync(
  new URL("../src/components/contact-form-hub.ts", import.meta.url),
  "utf8",
);

test("production mounts Awful and the contact-only window", () => {
  assert.match(main, /mountPortfolioPet\(document, \{ enabled: true \}\)/);
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


test("production browser sanity supports the temporary mascot-off state", () => {
  assert.match(productionE2E, /await pet\.count\(\)/);
  assert.match(productionE2E, /page\.locator\(['"]a\[href=.*mailto:i@lookawful\.ru/);
  assert.match(form, /const SITE_CONTACT_SELECTOR = 'a\[href="mailto:i@lookawful\.ru"\]';/);
});
