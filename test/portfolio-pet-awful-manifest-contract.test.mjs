import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const awfulModuleUrl = new URL(
  "../src/features/portfolio-pet/awful-manifest.ts",
  import.meta.url,
);
const spriteModuleUrl = new URL(
  "../src/features/portfolio-pet/sprite-manifest.ts",
  import.meta.url,
);

async function loadCanonicalAwful() {
  assert.equal(
    existsSync(awfulModuleUrl),
    true,
    "RED: canonical Awful manifest is not implemented yet",
  );
  const awful = await import(awfulModuleUrl.href);
  const sprite = await import(spriteModuleUrl.href);
  return { ...awful, ...sprite };
}

test("PET-001..014: canonical Awful v2 semantic states use the verified atlas rows", async () => {
  const {
    createAwfulSpriteManifest,
    resolveSpriteAnimation,
    resolveSpriteFrameRect,
  } = await loadCanonicalAwful();

  const manifest = createAwfulSpriteManifest("/pets/awful/awful-v2-spritesheet.webp");
  assert.equal(manifest.characterId, "awful");

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
    assert.equal(firstFrame.y, expectedY, `${state} must map to the verified Awful v2 row`);
    assert.equal(animation.frameCount, expectedCount, `${state} must preserve its verified frame count`);
    assert.equal(animation.frameWidth, 192);
    assert.equal(animation.frameHeight, 208);
    assert.equal(animation.src, "/pets/awful/awful-v2-spritesheet.webp");
  }
});

test("PET-010/PET-011: Awful interaction aliases resolve to the intended character reactions", async () => {
  const { createAwfulSpriteManifest, resolveSpriteAnimation } = await loadCanonicalAwful();
  const manifest = createAwfulSpriteManifest("/pets/awful/awful-v2-spritesheet.webp");

  assert.equal(resolveSpriteAnimation(manifest, "hover"), resolveSpriteAnimation(manifest, "open"));
  assert.equal(resolveSpriteAnimation(manifest, "reaction"), resolveSpriteAnimation(manifest, "success"));
  assert.equal(resolveSpriteAnimation(manifest, "speaking"), resolveSpriteAnimation(manifest, "review"));
});
