import assert from "node:assert/strict";
import test from "node:test";

async function loadProfileModule() {
  try {
    return await import("../tools/preview/qa/profile.mjs");
  } catch (error) {
    assert.fail(`preview QA profile module must be importable: ${error.message}`);
  }
}

test("preview QA always includes baseline and ignores unrelated paths", async () => {
  const { selectPreviewQaProfiles } = await loadProfileModule();
  assert.deepEqual(selectPreviewQaProfiles([]), ["baseline"]);
  assert.deepEqual(selectPreviewQaProfiles(["README.md", "docs/notes.md"]), ["baseline"]);
});

test("portfolio pet and contact hub changes select the venus profile", async () => {
  const { selectPreviewQaProfiles } = await loadProfileModule();
  assert.deepEqual(
    selectPreviewQaProfiles([
      "src/components/contact-hub.ts",
      "src/features/portfolio-pet/sprite-runtime.ts",
      "public/pets/awful/awful-v2-spritesheet.webp",
    ]),
    ["baseline", "venus"],
  );
});

test("gallery changes select the gallery profile", async () => {
  const { selectPreviewQaProfiles } = await loadProfileModule();
  assert.deepEqual(
    selectPreviewQaProfiles([
      "gallery/index.html",
      "src/components/gallery/gallery-controller.ts",
      "src/site/renderers/gallery-page.ts",
    ]),
    ["baseline", "gallery"],
  );
});

test("awful studio prototype changes select the prototype profile", async () => {
  const { selectPreviewQaProfiles } = await loadProfileModule();
  assert.deepEqual(
    selectPreviewQaProfiles([
      "public/prototypes/pet-projects-awful-studio/app.js",
      "public/prototypes/pet-projects-awful-studio/assets/awful-studio-overview.webp",
    ]),
    ["baseline", "awful-studio"],
  );
});

test("multiple feature families compose deterministically without duplicates", async () => {
  const { selectPreviewQaProfiles } = await loadProfileModule();
  assert.deepEqual(
    selectPreviewQaProfiles([
      "src/components/gallery/gallery-entry.ts",
      "src/components/contact-hub.ts",
      "src/components/gallery/gallery-entry.ts",
      "public/prototypes/pet-projects-awful-studio/styles.css",
    ]),
    ["baseline", "venus", "gallery", "awful-studio"],
  );
});
