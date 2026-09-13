import { classifyPetGesture, clampPetPosition } from "../features/portfolio-pet/interaction.ts";
import { resolveSpriteAnimation, resolveSpriteFrameRect } from "../features/portfolio-pet/sprite-manifest.ts";
import { resolveAnimationFrame } from "../features/portfolio-pet/sprite-runtime.ts";
import { createVenusSpriteManifest } from "../features/portfolio-pet/venus-manifest.ts";

type Destroy = () => void;
type PetVisualState = "idle" | "thinking" | "speaking" | "success" | "error" | "dragging";

export interface MountPortfolioPetOptions {
  enabled: boolean;
}

const PET_SELECTOR = "[data-portfolio-pet-launcher]";
const POSITION_STORAGE_KEY = "looksawful:portfolio-pet-position:v1";
const DRAG_THRESHOLD = 10;
const MIN_VISIBLE = { width: 72, height: 96 } as const;
const VENUS_SPRITESHEET = "/pets/venus/venus-v2-spritesheet.webp";
const venusManifest = createVenusSpriteManifest(VENUS_SPRITESHEET);

function animationForState(state: PetVisualState): string {
  return state;
}

interface StoredPosition {
  x: number;
  y: number;
}

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  startTime: number;
  startRect: DOMRect;
  moved: boolean;
}

function isStoredPosition(value: unknown): value is StoredPosition {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.x === "number" && Number.isFinite(record.x)
    && typeof record.y === "number" && Number.isFinite(record.y);
}

function readStoredPosition(root: Document): StoredPosition | null {
  try {
    const raw = root.defaultView?.localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isStoredPosition(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredPosition(root: Document, position: StoredPosition): void {
  try {
    root.defaultView?.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Position persistence is optional and must never break the launcher.
  }
}

function viewportSize(root: Document): { width: number; height: number } {
  const view = root.defaultView;
  const visualViewport = view?.visualViewport;
  return {
    width: visualViewport?.width ?? view?.innerWidth ?? root.documentElement.clientWidth,
    height: visualViewport?.height ?? view?.innerHeight ?? root.documentElement.clientHeight,
  };
}

function dispatchMoved(root: Document, launcher: HTMLElement): void {
  const rect = launcher.getBoundingClientRect();
  root.dispatchEvent(new CustomEvent("portfolio-pet:moved", {
    detail: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
  }));
}

export function mountPortfolioPet(
  root: Document = document,
  { enabled }: MountPortfolioPetOptions,
): Destroy {
  if (!enabled || !root.body || root.querySelector(PET_SELECTOR)) return () => {};

  const launcher = root.createElement("button");
  launcher.type = "button";
  launcher.className = "portfolio-pet";
  launcher.dataset.portfolioPetLauncher = "";
  launcher.dataset.state = "idle";
  launcher.dataset.facing = "right";
  launcher.dataset.draggable = "true";
  launcher.style.setProperty("--pet-facing", "1");
  launcher.setAttribute("aria-label", "Открыть чат с Venus");

  const viewport = root.createElement("span");
  viewport.className = "portfolio-pet__viewport";
  viewport.setAttribute("aria-hidden", "true");

  const image = root.createElement("img");
  image.className = "portfolio-pet__image";
  image.src = VENUS_SPRITESHEET;
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  image.fetchPriority = "high";

  viewport.append(image);
  launcher.append(viewport);
  root.body.append(launcher);

  const view = root.defaultView;
  const reducedMotionQuery = view?.matchMedia("(prefers-reduced-motion: reduce)") ?? null;
  let frameRequest = 0;
  let currentAnimation = "idle";
  let animationStartedAt = performance.now();

  const startAnimation = (name: string): void => {
    currentAnimation = name;
    animationStartedAt = performance.now();
    launcher.dataset.animation = name;
  };

  const renderSprite = (now: number): void => {
    const animation = resolveSpriteAnimation(venusManifest, currentAnimation);
    const frame = resolveAnimationFrame(
      animation,
      now - animationStartedAt,
      reducedMotionQuery?.matches ?? false,
    );
    const rect = resolveSpriteFrameRect(animation, frame.frameIndex);
    image.style.transform = `translate(${-rect.x}px, ${-rect.y}px)`;
    image.dataset.frame = String(frame.frameIndex);
    frameRequest = view?.requestAnimationFrame(renderSprite) ?? 0;
  };

  startAnimation("idle");
  frameRequest = view?.requestAnimationFrame(renderSprite) ?? 0;

  let dragSession: DragSession | null = null;
  let suppressNextClick = false;
  let currentVisualState: PetVisualState = "idle";

  const setFacingFromDelta = (dx: number): void => {
    if (Math.abs(dx) < 0.5) return;
    const facing = dx < 0 ? "left" : "right";
    launcher.dataset.facing = facing;
    launcher.style.setProperty("--pet-facing", facing === "left" ? "-1" : "1");
  };

  const setVisualState = (state: PetVisualState): void => {
    currentVisualState = state;
    if (!dragSession?.moved) {
      launcher.dataset.state = state;
      startAnimation(animationForState(state));
    }
  };

  const applyPosition = (position: StoredPosition): StoredPosition => {
    const rect = launcher.getBoundingClientRect();
    const viewport = viewportSize(root);
    const clamped = clampPetPosition({
      position,
      widgetSize: { width: rect.width, height: rect.height },
      viewport,
      safeArea: { top: 8, right: 8, bottom: 8, left: 8 },
      minimumVisible: MIN_VISIBLE,
    });

    launcher.style.insetInlineStart = "auto";
    launcher.style.insetBlockEnd = "auto";
    launcher.style.left = `${Math.round(clamped.x)}px`;
    launcher.style.top = `${Math.round(clamped.y)}px`;
    return clamped;
  };

  const storedPosition = readStoredPosition(root);
  if (storedPosition) {
    requestAnimationFrame(() => {
      applyPosition(storedPosition);
      dispatchMoved(root, launcher);
    });
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || dragSession) return;
    const rect = launcher.getBoundingClientRect();
    dragSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      startTime: performance.now(),
      startRect: rect,
      moved: false,
    };
    launcher.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragSession.startX;
    const dy = event.clientY - dragSession.startY;
    const stepDx = event.clientX - dragSession.lastX;
    dragSession.lastX = event.clientX;
    if (!dragSession.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    setFacingFromDelta(Math.abs(stepDx) >= 0.5 ? stepDx : dx);
    dragSession.moved = true;
    launcher.dataset.dragging = "true";
    launcher.dataset.state = "dragging";
    if (currentAnimation !== "dragging") startAnimation(animationForState("dragging"));
    event.preventDefault();

    applyPosition({
      x: dragSession.startRect.left + dx,
      y: dragSession.startRect.top + dy,
    });
    dispatchMoved(root, launcher);
  };

  const finishPointer = (event: PointerEvent): void => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;

    const session = dragSession;
    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    const durationMs = Math.max(1, performance.now() - session.startTime);
    const viewportLeft = root.defaultView?.visualViewport?.offsetLeft ?? 0;
    const gesture = event.type === "pointercancel"
      ? "drag"
      : classifyPetGesture({
        dx,
        dy,
        durationMs,
        velocityX: dx / durationMs,
        viewportEdgeDistance: Math.max(0, event.clientX - viewportLeft),
      });

    dragSession = null;
    launcher.removeAttribute("data-dragging");
    launcher.dataset.state = currentVisualState;
    startAnimation(animationForState(currentVisualState));

    if (launcher.hasPointerCapture(event.pointerId)) launcher.releasePointerCapture(event.pointerId);

    if (gesture === "activate") return;

    suppressNextClick = true;
    if (gesture === "hide") {
      launcher.hidden = true;
      return;
    }

    const rect = launcher.getBoundingClientRect();
    writeStoredPosition(root, { x: rect.left, y: rect.top });
    dispatchMoved(root, launcher);
  };

  const onClickCapture = (event: MouseEvent): void => {
    if (!suppressNextClick) return;
    suppressNextClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const onPetState = (event: Event): void => {
    const detail = (event as CustomEvent<{ state?: PetVisualState }>).detail;
    const state = detail?.state;
    if (!state || !["idle", "thinking", "speaking", "success", "error", "dragging"].includes(state)) return;
    setVisualState(state);
  };

  const onResize = (): void => {
    if (!launcher.style.left || !launcher.style.top) return;
    const rect = launcher.getBoundingClientRect();
    const clamped = applyPosition({ x: rect.left, y: rect.top });
    writeStoredPosition(root, clamped);
    dispatchMoved(root, launcher);
  };

  const onPointerEnter = (): void => {
    if (!dragSession && currentVisualState === "idle") startAnimation("hover");
  };
  const onPointerLeave = (): void => {
    if (!dragSession && currentVisualState === "idle") startAnimation("idle");
  };

  launcher.addEventListener("pointerenter", onPointerEnter);
  launcher.addEventListener("pointerleave", onPointerLeave);
  launcher.addEventListener("pointerdown", onPointerDown);
  launcher.addEventListener("pointermove", onPointerMove);
  launcher.addEventListener("pointerup", finishPointer);
  launcher.addEventListener("pointercancel", finishPointer);
  launcher.addEventListener("click", onClickCapture, true);
  root.addEventListener("portfolio-pet:state", onPetState);
  root.defaultView?.addEventListener("resize", onResize);

  return () => {
    if (frameRequest && view) view.cancelAnimationFrame(frameRequest);
    launcher.removeEventListener("pointerenter", onPointerEnter);
    launcher.removeEventListener("pointerleave", onPointerLeave);
    launcher.removeEventListener("pointerdown", onPointerDown);
    launcher.removeEventListener("pointermove", onPointerMove);
    launcher.removeEventListener("pointerup", finishPointer);
    launcher.removeEventListener("pointercancel", finishPointer);
    launcher.removeEventListener("click", onClickCapture, true);
    root.removeEventListener("portfolio-pet:state", onPetState);
    root.defaultView?.removeEventListener("resize", onResize);
    launcher.remove();
  };
}
