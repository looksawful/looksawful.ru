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

test("PET-004/PET-007: an atlas row resolves to the intended visible frame rectangle", async () => {
  const { parseSpriteManifest, resolveSpriteFrameRect } = await loadManifestModule();
  assert.equal(
    typeof resolveSpriteFrameRect,
    "function",
    "RED: atlas frame rectangle resolution is not implemented yet",
  );

  const atlasManifest = parseSpriteManifest({
    version: 1,
    characterId: "venus",
    animations: {
      idle: {
        src: "/pets/venus/Venus-v2-spritesheet.png",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 6,
        fps: 4,
        loop: true,
        sourceX: 0,
        sourceY: 0,
        anchor: { x: 0.5, y: 1 },
      },
      wave: {
        src: "/pets/venus/Venus-v2-spritesheet.png",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 4,
        fps: 7,
        loop: false,
        sourceX: 0,
        sourceY: 624,
        anchor: { x: 0.5, y: 1 },
      },
    },
  });

  assert.deepEqual(resolveSpriteFrameRect(atlasManifest.animations.wave, 0), {
    x: 0,
    y: 624,
    width: 192,
    height: 208,
  });
  assert.deepEqual(resolveSpriteFrameRect(atlasManifest.animations.wave, 3), {
    x: 576,
    y: 624,
    width: 192,
    height: 208,
  });
});
