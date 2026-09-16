import type { SpriteAnimationDefinition } from "./sprite-manifest.ts";

export interface SpriteAnimationFrameState {
  frameIndex: number;
  completed: boolean;
}

export function resolveAnimationFrame(
  animation: SpriteAnimationDefinition,
  elapsedMs: number,
  reducedMotion: boolean,
): SpriteAnimationFrameState {
  if (reducedMotion) {
    return { frameIndex: 0, completed: false };
  }

  const safeElapsedMs = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const frameDurationMs = 1000 / animation.fps;
  const elapsedFrames = Math.floor(safeElapsedMs / frameDurationMs);

  if (animation.loop) {
    return {
      frameIndex: elapsedFrames % animation.frameCount,
      completed: false,
    };
  }

  const totalDurationMs = frameDurationMs * animation.frameCount;
  return {
    frameIndex: Math.min(elapsedFrames, animation.frameCount - 1),
    completed: safeElapsedMs >= totalDurationMs,
  };
}
