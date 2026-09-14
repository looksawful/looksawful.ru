import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

const awfulModuleUrl = new URL("../src/features/portfolio-pet/awful-manifest.ts", import.meta.url);
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

const V6_SOURCES = {
  main: "/pets/awful/v6/spritesheet.webp",
  extras: "/pets/awful/v6/extras/extra-animations.webp",
  musicHouseDance: "/pets/awful/v6/extras/animations/music-house-dance.webp",
  cameraProFlash: "/pets/awful/v6/extras/animations/camera-pro-flash.webp",
  phonePacing: "/pets/awful/v6/extras/animations/phone-pacing.webp",
  sleepCrossLegged: "/pets/awful/v6/extras/animations/sleep-cross-legged.webp",
};

test("PET-001..014: canonical Awful v6 semantic states use the verified main atlas", async () => {
  const { createAwfulSpriteManifest, resolveSpriteAnimation, resolveSpriteFrameRect } =
    await loadCanonicalAwful();

  const manifest = createAwfulSpriteManifest(V6_SOURCES);
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
    assert.equal(
      animation.frameCount,
      expectedCount,
      `${state} must preserve its verified frame count`,
    );
    assert.equal(animation.frameWidth, 192);
    assert.equal(animation.frameHeight, 208);
    assert.equal(animation.src, V6_SOURCES.main);
  }
});

test("PET-010/PET-011: Awful interaction aliases resolve to the intended character reactions", async () => {
  const { createAwfulSpriteManifest, resolveSpriteAnimation } = await loadCanonicalAwful();
  const manifest = createAwfulSpriteManifest(V6_SOURCES);

  assert.equal(resolveSpriteAnimation(manifest, "hover"), resolveSpriteAnimation(manifest, "open"));
  assert.equal(
    resolveSpriteAnimation(manifest, "reaction"),
    resolveSpriteAnimation(manifest, "success"),
  );
  assert.equal(
    resolveSpriteAnimation(manifest, "speaking"),
    resolveSpriteAnimation(manifest, "review"),
  );
});

test("Awful v6 exposes every approved extra animation with its real source geometry", async () => {
  const { createAwfulSpriteManifest, resolveSpriteAnimation } = await loadCanonicalAwful();
  const manifest = createAwfulSpriteManifest(V6_SOURCES);

  const expectations = [
    ["coffee", V6_SOURCES.extras, 0, 6],
    ["laptop", V6_SOURCES.extras, 208, 6],
    ["camera", V6_SOURCES.extras, 416, 8],
    ["flipchart", V6_SOURCES.extras, 624, 8],
    ["drawing-cross-legged", V6_SOURCES.extras, 832, 8],
    ["music-house-dance", V6_SOURCES.musicHouseDance, 0, 12],
    ["camera-pro-flash", V6_SOURCES.cameraProFlash, 0, 12],
    ["phone-pacing", V6_SOURCES.phonePacing, 0, 12],
    ["sleep-cross-legged", V6_SOURCES.sleepCrossLegged, 0, 12],
  ];

  for (const [name, expectedSrc, expectedY, expectedCount] of expectations) {
    const animation = resolveSpriteAnimation(manifest, name);
    assert.equal(animation.src, expectedSrc, `${name} must use its versioned v6 source`);
    assert.equal(animation.sourceY, expectedY, `${name} must use the intended atlas row`);
    assert.equal(animation.frameCount, expectedCount, `${name} must preserve every authored frame`);
    assert.equal(animation.frameWidth, 192);
    assert.equal(animation.frameHeight, 208);
  }

  assert.deepEqual(
    resolveSpriteAnimation(manifest, "camera-pro-flash").frameDurationsMs,
    [140, 125, 110, 100, 110, 150, 85, 100, 120, 135, 165, 180],
  );
});

test("Awful v6 web assets decode at the manifest dimensions while v2 remains available for rollback", async () => {
  const publicRoot = new URL("../public/", import.meta.url);
  const assets = [
    ["pets/awful/v6/spritesheet.webp", 1536, 2288],
    ["pets/awful/v6/extras/extra-animations.webp", 1536, 1040],
    ["pets/awful/v6/extras/animations/music-house-dance.webp", 2304, 208],
    ["pets/awful/v6/extras/animations/camera-pro-flash.webp", 2304, 208],
    ["pets/awful/v6/extras/animations/phone-pacing.webp", 2304, 208],
    ["pets/awful/v6/extras/animations/sleep-cross-legged.webp", 2304, 208],
  ];

  for (const [relativePath, width, height] of assets) {
    const bytes = await readFile(new URL(relativePath, publicRoot));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "webp", `${relativePath} must remain WebP`);
    assert.equal(metadata.width, width, `${relativePath} width must match the sprite grid`);
    assert.equal(metadata.height, height, `${relativePath} height must match the sprite grid`);
  }

  assert.equal(
    existsSync(new URL("pets/awful/awful-v2-spritesheet.webp", publicRoot)),
    true,
    "the previous v2 atlas must remain available for rollback",
  );
});

test("Awful v6 integrity manifest detects drift between the approved package and web assets", async () => {
  const packageRoot = new URL("../public/pets/awful/v6/", import.meta.url);
  const integrity = JSON.parse(
    await readFile(new URL("asset-integrity.json", packageRoot), "utf8"),
  );
  assert.equal(integrity.version, 6);
  assert.equal(integrity.algorithm, "sha256");

  for (const [relativePath, expectedHash] of Object.entries(integrity.files)) {
    const bytes = await readFile(new URL(relativePath, packageRoot));
    const actualHash = createHash("sha256").update(bytes).digest("hex");
    assert.equal(actualHash, expectedHash, `${relativePath} must match the approved v6 package`);
  }
});
