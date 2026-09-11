import assert from "node:assert/strict";
import test from "node:test";

const manifestModuleUrl = new URL(
  "../src/features/portfolio-pet/sprite-manifest.ts",
  import.meta.url,
);

const validManifest = {
  version: 1,
  characterId: "venus",
  animations: {
    idle: {
      src: "/assets/venus.webp",
      frameWidth: 148,
      frameHeight: 196,
      frameCount: 8,
      fps: 8,
      loop: true,
      anchor: { x: 0.5, y: 1 },
    },
    open: {
      src: "/assets/venus.webp",
      frameWidth: 148,
      frameHeight: 196,
      frameCount: 4,
      fps: 10,
      loop: false,
      anchor: { x: 0.5, y: 1 },
    },
  },
};

async function loadManifestModule() {
  return import(manifestModuleUrl.href);
}

test("PET-005/PET-008: invalid manifests fail safely before renderer use", async () => {
  const { parseSpriteManifest } = await loadManifestModule();
  assert.throws(
    () => parseSpriteManifest({ ...validManifest, animations: {} }),
    /animations must not be empty/,
  );
});

test("PET-006/PET-009: missing semantic animation falls back predictably to idle", async () => {
  const { parseSpriteManifest, resolveSpriteAnimation } = await loadManifestModule();
  assert.equal(
    typeof resolveSpriteAnimation,
    "function",
    "RED: semantic animation fallback is not implemented yet",
  );

  const manifest = parseSpriteManifest(validManifest);
  assert.equal(resolveSpriteAnimation(manifest, "open"), manifest.animations.open);
  assert.equal(resolveSpriteAnimation(manifest, "thinking"), manifest.animations.idle);
});
