import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const main = fs.readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const pet = fs.readFileSync(new URL("../src/components/portfolio-pet.ts", import.meta.url), "utf8");
const petCss = fs.readFileSync(new URL("../src/styles/portfolio-pet.css", import.meta.url), "utf8");
const formSource = fs.readFileSync(new URL("../src/components/contact-form-hub.ts", import.meta.url), "utf8");
const formCss = fs.readFileSync(new URL("../src/styles/contact-form-hub.css", import.meta.url), "utf8");
const manifest = fs.readFileSync(new URL("../src/features/portfolio-pet/awful-manifest.ts", import.meta.url), "utf8");
const contactModule = await import("../src/components/contact-form-hub.ts");

test("release candidate turns the production mascot back on", () => {
  assert.match(main, /mountPortfolioPet\(document, \{ enabled: true \}\)/);
});

test("contact form uses an internally scrollable body on short viewports", () => {
  assert.match(formCss, /\.contact-form-hub\s*\{[\s\S]*display:\s*grid/);
  assert.match(formCss, /\.contact-form-hub__form\s*\{[\s\S]*min-block-size:\s*0/);
  assert.match(formCss, /\.contact-form-hub__form\s*\{[\s\S]*overflow-y:\s*auto/);
});

test("contact window exposes non-modal dialog semantics", () => {
  assert.match(formSource, /setAttribute\("role", "dialog"\)/);
  assert.doesNotMatch(formSource, /aria-modal/);
});

test("mailto payload percent-encodes spaces instead of plus signs", () => {
  assert.equal(typeof contactModule.buildContactMailtoHref, "function");
  const href = contactModule.buildContactMailtoHref({
    name: "Иван Иванов",
    email: "test@example.com",
    message: "два слова",
  });
  assert.match(href, /subject=.*%20/);
  assert.match(href, /body=.*%20/);
  assert.doesNotMatch(href, /\+/);
});

test("pet mirrors a frame wrapper rather than the clipping viewport", () => {
  assert.match(pet, /portfolio-pet__facing/);
  assert.match(petCss, /\.portfolio-pet__facing\s*\{[\s\S]*scaleX\(var\(--pet-facing\)\)/);
  const viewportRule = petCss.match(/\.portfolio-pet__viewport\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.doesNotMatch(viewportRule, /scaleX/);
});

test("pet pauses RAF while hidden or reduced-motion is active", () => {
  assert.match(pet, /cancelAnimationFrame\(frameRequest\)/);
  assert.match(pet, /reducedMotionQuery\?\.addEventListener\("change"/);
  assert.match(pet, /if \(launcher\.hidden \|\| reducedMotionQuery\?\.matches\)/);
});

test("first hover uses the authored full-body glasses gesture with cooldown", () => {
  assert.match(manifest, /"full-body-glasses-gesture"/);
  assert.match(pet, /requestDecorativeAnimation\("full-body-glasses-gesture"/);
  assert.match(pet, /90_000/);
});

test("contact footer aligns fallback and submit controls in one row", () => {
  assert.match(formSource, /contact-form-hub__footer/);
  assert.match(formCss, /\.contact-form-hub__footer\s*\{[\s\S]*align-items:\s*center/);
  assert.match(formCss, /\.contact-form-hub__footer\s*\{[\s\S]*justify-content:\s*space-between/);
});

test("contact window positioning uses its rendered dimensions instead of stale constants", () => {
  assert.match(formSource, /hub\.offsetWidth/);
  assert.match(formSource, /hub\.offsetHeight/);
  assert.doesNotMatch(formSource, /const height = Math\.min\(404/);
});
