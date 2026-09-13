import {
  parseSpriteManifest,
  resolveSpriteAnimation,
  type SpriteAnimationDefinition,
  type SpriteManifest,
} from "./sprite-manifest.ts";

const AWFUL_FRAME_WIDTH = 192;
const AWFUL_FRAME_HEIGHT = 208;
const AWFUL_ANCHOR = { x: 0.5, y: 1 } as const;

interface AwfulClipOptions {
  row: number;
  frameCount: number;
  frameDurationMs: number;
  loop: boolean;
}

function createClip(src: string, options: AwfulClipOptions): SpriteAnimationDefinition {
  return {
    src,
    frameWidth: AWFUL_FRAME_WIDTH,
    frameHeight: AWFUL_FRAME_HEIGHT,
    frameCount: options.frameCount,
    fps: 1000 / options.frameDurationMs,
    loop: options.loop,
    sourceX: 0,
    sourceY: options.row * AWFUL_FRAME_HEIGHT,
    anchor: AWFUL_ANCHOR,
  };
}

export function createAwfulSpriteManifest(src: string): SpriteManifest {
  const base = parseSpriteManifest({
    version: 1,
    characterId: "awful",
    animations: {
      idle: createClip(src, { row: 0, frameCount: 6, frameDurationMs: 280, loop: true }),
      dragging: createClip(src, { row: 1, frameCount: 8, frameDurationMs: 110, loop: true }),
      open: createClip(src, { row: 3, frameCount: 4, frameDurationMs: 140, loop: false }),
      thinking: createClip(src, { row: 6, frameCount: 6, frameDurationMs: 150, loop: true }),
      review: createClip(src, { row: 8, frameCount: 6, frameDurationMs: 150, loop: false }),
      success: createClip(src, { row: 4, frameCount: 5, frameDurationMs: 140, loop: false }),
      error: createClip(src, { row: 5, frameCount: 8, frameDurationMs: 140, loop: false }),
    },
  });

  const open = resolveSpriteAnimation(base, "open");
  const review = resolveSpriteAnimation(base, "review");
  const success = resolveSpriteAnimation(base, "success");

  return {
    ...base,
    animations: {
      ...base.animations,
      hover: open,
      reaction: success,
      speaking: review,
    },
  };
}
