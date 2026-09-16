export interface SpriteAnchor {
  x: number;
  y: number;
}

export interface SpriteHitbox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteAnimationDefinition {
  src: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
  sourceX: number;
  sourceY: number;
  anchor: SpriteAnchor;
  hitbox?: SpriteHitbox;
}

export interface SpriteManifest {
  version: 1;
  characterId: string;
  animations: Readonly<Record<string, SpriteAnimationDefinition>>;
}

export interface SpriteFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function expectPositiveNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return value;
}

function expectPositiveInteger(value: unknown, label: string): number {
  const parsed = expectPositiveNumber(value, label);
  if (!Number.isInteger(parsed)) throw new Error(`${label} must be an integer`);
  return parsed;
}

function expectFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function expectNonNegativeNumber(value: unknown, label: string): number {
  const parsed = expectFiniteNumber(value, label);
  if (parsed < 0) throw new Error(`${label} must not be negative`);
  return parsed;
}

function parseAnchor(value: unknown, label: string): SpriteAnchor {
  const record = expectRecord(value, label);
  const x = expectFiniteNumber(record.x, `${label}.x`);
  const y = expectFiniteNumber(record.y, `${label}.y`);
  if (x < 0 || x > 1 || y < 0 || y > 1) {
    throw new Error(`${label} coordinates must be between 0 and 1`);
  }
  return { x, y };
}

function parseHitbox(value: unknown, label: string): SpriteHitbox {
  const record = expectRecord(value, label);
  return {
    x: expectFiniteNumber(record.x, `${label}.x`),
    y: expectFiniteNumber(record.y, `${label}.y`),
    width: expectPositiveNumber(record.width, `${label}.width`),
    height: expectPositiveNumber(record.height, `${label}.height`),
  };
}

function parseAnimation(value: unknown, label: string): SpriteAnimationDefinition {
  const record = expectRecord(value, label);
  if (typeof record.loop !== "boolean") throw new Error(`${label}.loop must be a boolean`);

  const animation: SpriteAnimationDefinition = {
    src: expectNonEmptyString(record.src, `${label}.src`),
    frameWidth: expectPositiveInteger(record.frameWidth, `${label}.frameWidth`),
    frameHeight: expectPositiveInteger(record.frameHeight, `${label}.frameHeight`),
    frameCount: expectPositiveInteger(record.frameCount, `${label}.frameCount`),
    fps: expectPositiveNumber(record.fps, `${label}.fps`),
    loop: record.loop,
    sourceX: record.sourceX === undefined ? 0 : expectNonNegativeNumber(record.sourceX, `${label}.sourceX`),
    sourceY: record.sourceY === undefined ? 0 : expectNonNegativeNumber(record.sourceY, `${label}.sourceY`),
    anchor: parseAnchor(record.anchor, `${label}.anchor`),
  };

  if (record.hitbox !== undefined) {
    animation.hitbox = parseHitbox(record.hitbox, `${label}.hitbox`);
  }

  return animation;
}

export function parseSpriteManifest(value: unknown): SpriteManifest {
  const record = expectRecord(value, "sprite manifest");
  if (record.version !== 1) throw new Error("sprite manifest.version must be 1");
  const animationsRecord = expectRecord(record.animations, "sprite manifest.animations");
  const entries = Object.entries(animationsRecord);
  if (!entries.length) throw new Error("sprite manifest.animations must not be empty");

  const animations: Record<string, SpriteAnimationDefinition> = {};
  for (const [name, animation] of entries) {
    if (!name.trim()) throw new Error("sprite manifest animation name must not be empty");
    animations[name] = parseAnimation(animation, `sprite manifest.animations.${name}`);
  }
  if (!animations.idle) throw new Error("sprite manifest.animations.idle is required");

  return {
    version: 1,
    characterId: expectNonEmptyString(record.characterId, "sprite manifest.characterId"),
    animations,
  };
}

export function resolveSpriteAnimation(
  manifest: SpriteManifest,
  animationName: string,
): SpriteAnimationDefinition {
  const requested = manifest.animations[animationName];
  if (requested) return requested;

  const idle = manifest.animations.idle;
  if (!idle) throw new Error("sprite manifest.animations.idle is required");
  return idle;
}

export function resolveSpriteFrameRect(
  animation: SpriteAnimationDefinition,
  frameIndex: number,
): SpriteFrameRect {
  const safeIndex = Math.max(0, Math.min(animation.frameCount - 1, Math.trunc(frameIndex)));
  return {
    x: animation.sourceX + (safeIndex * animation.frameWidth),
    y: animation.sourceY,
    width: animation.frameWidth,
    height: animation.frameHeight,
  };
}
