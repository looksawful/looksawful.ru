export type PetGestureResult = "activate" | "drag" | "hide";

export interface PetGestureInput {
  dx: number;
  dy: number;
  durationMs: number;
  velocityX?: number;
  viewportEdgeDistance?: number;
}

const ACTIVATE_DISTANCE = 10;
const HIDE_DISTANCE = 120;
const HIDE_MAX_CROSS_AXIS = 48;
const HIDE_MAX_EDGE_DISTANCE = 40;
const HIDE_MIN_VELOCITY_X = -0.5;

export function classifyPetGesture(input: PetGestureInput): PetGestureResult {
  const distance = Math.hypot(input.dx, input.dy);
  if (distance <= ACTIVATE_DISTANCE) return "activate";

  const deliberateHide =
    input.dx <= -HIDE_DISTANCE &&
    Math.abs(input.dy) <= HIDE_MAX_CROSS_AXIS &&
    (input.velocityX ?? 0) <= HIDE_MIN_VELOCITY_X &&
    (input.viewportEdgeDistance ?? Number.POSITIVE_INFINITY) <= HIDE_MAX_EDGE_DISTANCE;

  return deliberateHide ? "hide" : "drag";
}

export interface PetPositionInput {
  position: { x: number; y: number };
  widgetSize: { width: number; height: number };
  viewport: { x?: number; y?: number; width: number; height: number };
  safeArea: { top: number; right: number; bottom: number; left: number };
  minimumVisible: { width: number; height: number };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

export function clampPetPosition(input: PetPositionInput): { x: number; y: number } {
  const visibleWidth = Math.min(input.widgetSize.width, Math.max(0, input.minimumVisible.width));
  const visibleHeight = Math.min(input.widgetSize.height, Math.max(0, input.minimumVisible.height));
  const viewportX = input.viewport.x ?? 0;
  const viewportY = input.viewport.y ?? 0;

  const minX = viewportX + input.safeArea.left - (input.widgetSize.width - visibleWidth);
  const maxX = viewportX + input.viewport.width - input.safeArea.right - visibleWidth;
  const minY = viewportY + input.safeArea.top - (input.widgetSize.height - visibleHeight);
  const maxY = viewportY + input.viewport.height - input.safeArea.bottom - visibleHeight;

  return {
    x: clamp(input.position.x, minX, maxX),
    y: clamp(input.position.y, minY, maxY),
  };
}
