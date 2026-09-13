import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const runtimeUrl = new URL(
  "../src/features/portfolio-pet/sprite-runtime.ts",
  import.meta.url,
);
const awfulUrl = new URL(
  "../src/features/portfolio-pet/awful-manifest.ts",
  import.meta.url,
);

async function loadRuntime() {
  assert.equal(existsSync(runtimeUrl), true, "RED: sprite animation runtime is not implemented yet");
  const runtime = await import(runtimeUrl.href);
  const { createAwfulSpriteManifest } = await import(awfulUrl.href);
  return { ...runtime, createAwfulSpriteManifest };
}

test("PET-006: looping idle advances by elapsed time and wraps", async () => {
  const { resolveAnimationFrame, createAwfulSpriteManifest } = await loadRuntime();
  const manifest = createAwfulSpriteManifest("/awful.webp");
  const idle = manifest.animations.idle;

  assert.deepEqual(resolveAnimationFrame(idle, 0, false), { frameIndex: 0, completed: false });
  assert.deepEqual(resolveAnimationFrame(idle, 280, false), { frameIndex: 1, completed: false });
  assert.deepEqual(resolveAnimationFrame(idle, 1680, false), { frameIndex: 0, completed: false });
  assert.deepEqual(resolveAnimationFrame(idle, 1960, false), { frameIndex: 1, completed: false });
});

test("PET-009: one-shot reactions stop on their last frame", async () => {
  const { resolveAnimationFrame, createAwfulSpriteManifest } = await loadRuntime();
  const manifest = createAwfulSpriteManifest("/awful.webp");
  const success = manifest.animations.success;

  assert.deepEqual(resolveAnimationFrame(success, 0, false), { frameIndex: 0, completed: false });
  assert.deepEqual(resolveAnimationFrame(success, 559, false), { frameIndex: 3, completed: false });
  assert.deepEqual(resolveAnimationFrame(success, 700, false), { frameIndex: 4, completed: true });
  assert.deepEqual(resolveAnimationFrame(success, 9000, false), { frameIndex: 4, completed: true });
});

test("PET-012/MO-004: reduced motion stays on a stable representative frame", async () => {
  const { resolveAnimationFrame, createAwfulSpriteManifest } = await loadRuntime();
  const manifest = createAwfulSpriteManifest("/awful.webp");

  assert.deepEqual(resolveAnimationFrame(manifest.animations.idle, 9000, true), {
    frameIndex: 0,
    completed: false,
  });
  assert.deepEqual(resolveAnimationFrame(manifest.animations.success, 9000, true), {
    frameIndex: 0,
    completed: false,
  });
});
