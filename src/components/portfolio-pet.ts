import { clampPetPosition } from "../features/portfolio-pet/interaction.ts";

type Destroy = () => void;
type PetVisualState = "idle" | "thinking" | "speaking" | "success" | "error" | "dragging";

export interface MountPortfolioPetOptions {
  enabled: boolean;
}

const PET_SELECTOR = "[data-portfolio-pet-launcher]";
const POSITION_STORAGE_KEY = "looksawful:portfolio-pet-position:v1";
const DRAG_THRESHOLD = 6;
const MIN_VISIBLE = { width: 72, height: 96 } as const;

interface StoredPosition {
  x: number;
  y: number;
}

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
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
  launcher.dataset.draggable = "true";
  launcher.setAttribute("aria-label", "Открыть чат с Venus");

  const image = root.createElement("img");
  image.className = "portfolio-pet__image";
  image.src = "/pets/venus/venus-idle.webp";
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  image.fetchPriority = "high";

  launcher.append(image);
  root.body.append(launcher);

  let dragSession: DragSession | null = null;
  let suppressNextClick = false;
  let currentVisualState: PetVisualState = "idle";

  const setVisualState = (state: PetVisualState): void => {
    currentVisualState = state;
    if (!dragSession?.moved) launcher.dataset.state = state;
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
    if (!dragSession.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    dragSession.moved = true;
    launcher.dataset.dragging = "true";
    launcher.dataset.state = "dragging";
    event.preventDefault();

    applyPosition({
      x: dragSession.startRect.left + dx,
      y: dragSession.startRect.top + dy,
    });
    dispatchMoved(root, launcher);
  };

  const finishPointer = (event: PointerEvent): void => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;
    const moved = dragSession.moved;
    dragSession = null;
    launcher.removeAttribute("data-dragging");
    launcher.dataset.state = currentVisualState;

    if (launcher.hasPointerCapture(event.pointerId)) launcher.releasePointerCapture(event.pointerId);
    if (!moved) return;

    suppressNextClick = true;
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

  launcher.addEventListener("pointerdown", onPointerDown);
  launcher.addEventListener("pointermove", onPointerMove);
  launcher.addEventListener("pointerup", finishPointer);
  launcher.addEventListener("pointercancel", finishPointer);
  launcher.addEventListener("click", onClickCapture, true);
  root.addEventListener("portfolio-pet:state", onPetState);
  root.defaultView?.addEventListener("resize", onResize);

  return () => {
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
