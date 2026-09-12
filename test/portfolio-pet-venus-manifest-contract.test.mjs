import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const venusModuleUrl = new URL(
  "../src/features/portfolio-pet/venus-manifest.ts",
  import.meta.url,
);
const spriteModuleUrl = new URL(
  "../src/features/portfolio-pet/sprite-manifest.ts",
  import.meta.url,
);

async function loadCanonicalVenus() {
  assert.equal(
    existsSync(venusModuleUrl),
    true,
    "RED: canonical Venus manifest is not implemented yet",
  );
  const venus = await import(venusModuleUrl.href);
  const sprite = await import(spriteModuleUrl.href);
  return { ...venus, ...sprite };
}

test("PET-001..014: canonical Venus v2 semantic states use the verified atlas rows", async () => {
  const {
    createVenusSpriteManifest,
    resolveSpriteAnimation,
    resolveSpriteFrameRect,
  } = await loadCanonicalVenus();

  const manifest = createVenusSpriteManifest("/pets/venus/venus-v2-spritesheet.webp");
  assert.equal(manifest.characterId, "venus");

  const expectations = [
    ["idle", 0, 6],
    ["dragging", 208, 8],
    ["open", 624, 4],
    ["thinking", 1248, 6],
    ["review", 1664, 6],
    ["success", 832, 5],
    ["error", 1040, 8],
  ];

  for (const [state, expectedY, expectedCount] of expectations) {
    const animation = resolveSpriteAnimation(manifest, state);
    const firstFrame = resolveSpriteFrameRect(animation, 0);
    assert.equal(firstFrame.y, expectedY, `${state} must map to the verified Venus v2 row`);
    assert.equal(animation.frameCount, expectedCount, `${state} must preserve its verified frame count`);
    assert.equal(animation.frameWidth, 192);
    assert.equal(animation.frameHeight, 208);
    assert.equal(animation.src, "/pets/venus/venus-v2-spritesheet.webp");
  }
});

test("PET-010/PET-011: Venus interaction aliases resolve to the intended character reactions", async () => {
  const { createVenusSpriteManifest, resolveSpriteAnimation } = await loadCanonicalVenus();
  const manifest = createVenusSpriteManifest("/pets/venus/venus-v2-spritesheet.webp");

  assert.equal(resolveSpriteAnimation(manifest, "hover"), resolveSpriteAnimation(manifest, "open"));
  assert.equal(resolveSpriteAnimation(manifest, "reaction"), resolveSpriteAnimation(manifest, "success"));
  assert.equal(resolveSpriteAnimation(manifest, "speaking"), resolveSpriteAnimation(manifest, "review"));
});
