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
  frameDurationsMs?: readonly number[];
}

export interface AwfulSpriteSources {
  main: string;
  extras: string;
  musicHouseDance: string;
  cameraProFlash: string;
  phonePacing: string;
  sleepCrossLegged: string;
}

function createClip(src: string, options: AwfulClipOptions): SpriteAnimationDefinition {
  return {
    src,
    frameWidth: AWFUL_FRAME_WIDTH,
    frameHeight: AWFUL_FRAME_HEIGHT,
    frameCount: options.frameCount,
    fps: 1000 / options.frameDurationMs,
    ...(options.frameDurationsMs ? { frameDurationsMs: options.frameDurationsMs } : {}),
    loop: options.loop,
    sourceX: 0,
    sourceY: options.row * AWFUL_FRAME_HEIGHT,
    anchor: AWFUL_ANCHOR,
  };
}

export function createAwfulSpriteManifest(sources: string | AwfulSpriteSources): SpriteManifest {
  const main = typeof sources === "string" ? sources : sources.main;
  const extraAnimations =
    typeof sources === "string"
      ? {}
      : {
          coffee: createClip(sources.extras, {
            row: 0,
            frameCount: 6,
            frameDurationMs: 180,
            loop: false,
          }),
          laptop: createClip(sources.extras, {
            row: 1,
            frameCount: 6,
            frameDurationMs: 170,
            loop: true,
          }),
          camera: createClip(sources.extras, {
            row: 2,
            frameCount: 8,
            frameDurationMs: 130,
            loop: false,
          }),
          flipchart: createClip(sources.extras, {
            row: 3,
            frameCount: 8,
            frameDurationMs: 180,
            loop: false,
          }),
          "drawing-cross-legged": createClip(sources.extras, {
            row: 4,
            frameCount: 8,
            frameDurationMs: 160,
            loop: false,
          }),
          "music-house-dance": createClip(sources.musicHouseDance, {
            row: 0,
            frameCount: 12,
            frameDurationMs: 100,
            frameDurationsMs: [110, 95, 90, 85, 90, 110, 95, 90, 85, 90, 100, 120],
            loop: true,
          }),
          "camera-pro-flash": createClip(sources.cameraProFlash, {
            row: 0,
            frameCount: 12,
            frameDurationMs: 125,
            frameDurationsMs: [140, 125, 110, 100, 110, 150, 85, 100, 120, 135, 165, 180],
            loop: false,
          }),
          "phone-pacing": createClip(sources.phonePacing, {
            row: 0,
            frameCount: 12,
            frameDurationMs: 115,
            frameDurationsMs: [145, 125, 110, 105, 100, 100, 105, 115, 100, 100, 120, 150],
            loop: true,
          }),
          "sleep-cross-legged": createClip(sources.sleepCrossLegged, {
            row: 0,
            frameCount: 12,
            frameDurationMs: 255,
            frameDurationsMs: [180, 190, 210, 230, 260, 310, 350, 420, 300, 230, 190, 180],
            loop: true,
          }),
        };
  const base = parseSpriteManifest({
    version: 1,
    characterId: "awful",
    animations: {
      idle: createClip(main, { row: 0, frameCount: 6, frameDurationMs: 280, loop: true }),
      dragging: createClip(main, { row: 1, frameCount: 8, frameDurationMs: 110, loop: true }),
      open: createClip(main, { row: 3, frameCount: 4, frameDurationMs: 140, loop: false }),
      thinking: createClip(main, { row: 6, frameCount: 6, frameDurationMs: 150, loop: true }),
      review: createClip(main, { row: 8, frameCount: 6, frameDurationMs: 150, loop: false }),
      success: createClip(main, { row: 4, frameCount: 5, frameDurationMs: 140, loop: false }),
      error: createClip(main, { row: 5, frameCount: 8, frameDurationMs: 140, loop: false }),
      ...extraAnimations,
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
