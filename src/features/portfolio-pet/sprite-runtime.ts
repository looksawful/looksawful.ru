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
  const authoredDurations = animation.frameDurationsMs;
  if (authoredDurations) {
    const cycleDurationMs = authoredDurations.reduce((total, duration) => total + duration, 0);
    const completed = !animation.loop && safeElapsedMs >= cycleDurationMs;
    const positionMs = animation.loop
      ? safeElapsedMs % cycleDurationMs
      : Math.min(safeElapsedMs, Math.max(0, cycleDurationMs - Number.EPSILON));
    let boundaryMs = 0;
    for (let frameIndex = 0; frameIndex < authoredDurations.length; frameIndex += 1) {
      boundaryMs += authoredDurations[frameIndex] ?? 0;
      if (positionMs < boundaryMs) return { frameIndex, completed };
    }
    return { frameIndex: animation.frameCount - 1, completed };
  }

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
