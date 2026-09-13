import { classifyPetGesture, clampPetPosition } from "../features/portfolio-pet/interaction.ts";
import { resolveSpriteAnimation, resolveSpriteFrameRect } from "../features/portfolio-pet/sprite-manifest.ts";
import { resolveAnimationFrame } from "../features/portfolio-pet/sprite-runtime.ts";
import { createAwfulSpriteManifest } from "../features/portfolio-pet/awful-manifest.ts";

type Destroy = () => void;
type PetVisualState = "idle" | "thinking" | "speaking" | "success" | "error" | "dragging";

export interface MountPortfolioPetOptions {
  enabled: boolean;
}

const PET_SELECTOR = "[data-portfolio-pet-launcher]";
const CONSENT_SELECTOR = ".site-analytics-consent";
const CONTACT_CTA_SELECTOR = '.contact a[href="mailto:i@lookawful.ru"]';
const POSITION_STORAGE_KEY = "looksawful:portfolio-pet-position:v1";
const DRAG_THRESHOLD = 10;
const MIN_VISIBLE = { width: 72, height: 96 } as const;
const MIN_SAFE_MARGIN = 8;
const OBSTACLE_GAP = 12;
const AWFUL_SPRITESHEET = "/pets/awful/awful-v2-spritesheet.webp";
const awfulManifest = createAwfulSpriteManifest(AWFUL_SPRITESHEET);

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

interface RectEdges {
  left: number;
  right: number;
  top: number;
  bottom: number;
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

function viewportSize(root: Document): { x: number; y: number; width: number; height: number } {
  const view = root.defaultView;
  const visualViewport = view?.visualViewport;
  return {
    x: visualViewport?.offsetLeft ?? 0,
    y: visualViewport?.offsetTop ?? 0,
    width: visualViewport?.width ?? view?.innerWidth ?? root.documentElement.clientWidth,
    height: visualViewport?.height ?? view?.innerHeight ?? root.documentElement.clientHeight,
  };
}

function parseCssPixels(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function safeAreaFor(root: Document, launcher: HTMLElement) {
  const style = root.defaultView?.getComputedStyle(launcher);
  const read = (property: string): number => Math.max(
    MIN_SAFE_MARGIN,
    parseCssPixels(style?.getPropertyValue(property) ?? ""),
  );
  return {
    top: read("--pet-safe-top"),
    right: read("--pet-safe-right"),
    bottom: read("--pet-safe-bottom"),
    left: read("--pet-safe-left"),
  };
}

function rectsOverlap(a: RectEdges, b: RectEdges): boolean {
  return !(
    a.right <= b.left || b.right <= a.left ||
    a.bottom <= b.top || b.bottom <= a.top
  );
}

function isVisibleElement(root: Document, element: HTMLElement): boolean {
  const style = root.defaultView?.getComputedStyle(element);
  if (!style || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
  const rect = element.getBoundingClientRect();
  const viewport = viewportSize(root);
  return rect.right > viewport.x
    && rect.left < viewport.x + viewport.width
    && rect.bottom > viewport.y
    && rect.top < viewport.y + viewport.height;
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
  launcher.setAttribute("aria-label", "Открыть чат с Awful");

  const dismissButton = root.createElement("button");
  dismissButton.type = "button";
  dismissButton.className = "portfolio-pet__dismiss";
  dismissButton.dataset.portfolioPetDismiss = "";
  dismissButton.setAttribute("aria-label", "Скрыть Awful");
  dismissButton.textContent = "×";

  const restoreButton = root.createElement("button");
  restoreButton.type = "button";
  restoreButton.className = "portfolio-pet__restore";
  restoreButton.dataset.portfolioPetRestore = "";
  restoreButton.setAttribute("aria-label", "Показать Awful");
  restoreButton.textContent = "→";
  restoreButton.hidden = true;

  const viewport = root.createElement("span");
  viewport.className = "portfolio-pet__viewport";
  viewport.setAttribute("aria-hidden", "true");

  const image = root.createElement("img");
  image.className = "portfolio-pet__image";
  image.src = AWFUL_SPRITESHEET;
  image.alt = "";
  image.draggable = false;
  image.decoding = "async";
  image.fetchPriority = "high";

  viewport.append(image);
  launcher.append(viewport);
  root.body.append(launcher, dismissButton, restoreButton);

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
    const animation = resolveSpriteAnimation(awfulManifest, currentAnimation);
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
  let observedConsent: HTMLElement | null = null;

  const syncPetControls = (): void => {
    if (launcher.hidden) return;
    const rect = launcher.getBoundingClientRect();
    dismissButton.style.left = `${Math.round(rect.right - 26)}px`;
    dismissButton.style.top = `${Math.round(rect.top + 8)}px`;
  };

  const hidePet = (): void => {
    const rect = launcher.getBoundingClientRect();
    launcher.hidden = true;
    dismissButton.hidden = true;
    restoreButton.style.top = `${Math.round(Math.max(16, Math.min(rect.top + rect.height / 2 - 18, (view?.innerHeight ?? 800) - 52)))}px`;
    restoreButton.hidden = false;
    restoreButton.focus({ preventScroll: true });
  };

  const restorePet = (): void => {
    restoreButton.hidden = true;
    launcher.hidden = false;
    dismissButton.hidden = false;
    updateDefaultObstacleOffset();
    requestAnimationFrame(() => { syncPetControls(); launcher.focus({ preventScroll: true }); });
  };

  const consentResizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(() => {
      updateDefaultObstacleOffset();
      syncPetControls();
    })
    : null;

  function bindConsentObserver(consent: HTMLElement | null): void {
    if (consent === observedConsent) return;
    consentResizeObserver?.disconnect();
    observedConsent = consent;
    if (consent) consentResizeObserver?.observe(consent);
  }

  function updateDefaultObstacleOffset(): void {
    if (launcher.style.left || launcher.style.top || launcher.hidden) {
      launcher.style.setProperty("--pet-consent-offset", "0px");
      return;
    }

    const style = view?.getComputedStyle(launcher);
    const currentOffset = parseCssPixels(style?.getPropertyValue("--pet-consent-offset") ?? "");
    const petRect = launcher.getBoundingClientRect();
    const baseRect: RectEdges = {
      left: petRect.left,
      right: petRect.right,
      top: petRect.top + currentOffset,
      bottom: petRect.bottom + currentOffset,
    };
    let requestedOffset = 0;

    const consent = root.querySelector<HTMLElement>(CONSENT_SELECTOR);
    bindConsentObserver(consent);
    if (consent && isVisibleElement(root, consent)) {
      const consentRect = consent.getBoundingClientRect();
      if (rectsOverlap(baseRect, consentRect)) {
        requestedOffset = Math.max(requestedOffset, baseRect.bottom - consentRect.top + OBSTACLE_GAP);
      }
    }

    const contactCta = root.querySelector<HTMLElement>(CONTACT_CTA_SELECTOR);
    if (contactCta && isVisibleElement(root, contactCta)) {
      const contactRect = contactCta.getBoundingClientRect();
      if (rectsOverlap(baseRect, contactRect)) {
        requestedOffset = Math.max(requestedOffset, baseRect.bottom - contactRect.top + OBSTACLE_GAP);
      }
    }

    const maxOffset = Math.max(0, baseRect.top - safeAreaFor(root, launcher).top);
    launcher.style.setProperty("--pet-consent-offset", `${Math.min(requestedOffset, maxOffset)}px`);
  }

  const consentMutationObserver = typeof MutationObserver === "function"
    ? new MutationObserver(() => {
      updateDefaultObstacleOffset();
      syncPetControls();
    })
    : null;
  consentMutationObserver?.observe(root.body, { childList: true, subtree: true });
  view?.requestAnimationFrame(() => { updateDefaultObstacleOffset(); syncPetControls(); });

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
    const viewportRect = viewportSize(root);
    const clamped = clampPetPosition({
      position,
      widgetSize: { width: rect.width, height: rect.height },
      viewport: viewportRect,
      safeArea: safeAreaFor(root, launcher),
      minimumVisible: MIN_VISIBLE,
    });

    launcher.style.insetInlineStart = "auto";
    launcher.style.insetBlockEnd = "auto";
    launcher.style.left = `${Math.round(clamped.x)}px`;
    launcher.style.top = `${Math.round(clamped.y)}px`;
    launcher.style.setProperty("--pet-consent-offset", "0px");
    return clamped;
  };

  const storedPosition = readStoredPosition(root);
  if (storedPosition) {
    requestAnimationFrame(() => {
      applyPosition(storedPosition);
      dispatchMoved(root, launcher);
      syncPetControls();
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
    syncPetControls();
  };

  const finishPointer = (event: PointerEvent): void => {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;

    const session = dragSession;
    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    const durationMs = Math.max(1, performance.now() - session.startTime);
    const viewportLeft = viewportSize(root).x;
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
      hidePet();
      return;
    }

    const rect = launcher.getBoundingClientRect();
    writeStoredPosition(root, { x: rect.left, y: rect.top });
    dispatchMoved(root, launcher);
    syncPetControls();
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
    if (!launcher.style.left || !launcher.style.top) {
      updateDefaultObstacleOffset();
      syncPetControls();
      return;
    }
    const rect = launcher.getBoundingClientRect();
    const clamped = applyPosition({ x: rect.left, y: rect.top });
    writeStoredPosition(root, clamped);
    dispatchMoved(root, launcher);
    syncPetControls();
  };

  const onScroll = (): void => {
    if (launcher.style.left || launcher.style.top || launcher.hidden) return;
    updateDefaultObstacleOffset();
    syncPetControls();
  };

  const onPointerEnter = (): void => {
    if (!dragSession && currentVisualState === "idle") startAnimation("hover");
  };
  const onPointerLeave = (): void => {
    if (!dragSession && currentVisualState === "idle") startAnimation("idle");
  };

  dismissButton.addEventListener("click", hidePet);
  restoreButton.addEventListener("click", restorePet);
  launcher.addEventListener("pointerenter", onPointerEnter);
  launcher.addEventListener("pointerleave", onPointerLeave);
  launcher.addEventListener("pointerdown", onPointerDown);
  launcher.addEventListener("pointermove", onPointerMove);
  launcher.addEventListener("pointerup", finishPointer);
  launcher.addEventListener("pointercancel", finishPointer);
  launcher.addEventListener("click", onClickCapture, true);
  root.addEventListener("portfolio-pet:state", onPetState);
  view?.addEventListener("resize", onResize);
  view?.addEventListener("scroll", onScroll, { passive: true });
  view?.visualViewport?.addEventListener("resize", onResize);
  view?.visualViewport?.addEventListener("scroll", onResize);

  return () => {
    if (frameRequest && view) view.cancelAnimationFrame(frameRequest);
    consentMutationObserver?.disconnect();
    consentResizeObserver?.disconnect();
    dismissButton.removeEventListener("click", hidePet);
    restoreButton.removeEventListener("click", restorePet);
    launcher.removeEventListener("pointerenter", onPointerEnter);
    launcher.removeEventListener("pointerleave", onPointerLeave);
    launcher.removeEventListener("pointerdown", onPointerDown);
    launcher.removeEventListener("pointermove", onPointerMove);
    launcher.removeEventListener("pointerup", finishPointer);
    launcher.removeEventListener("pointercancel", finishPointer);
    launcher.removeEventListener("click", onClickCapture, true);
    root.removeEventListener("portfolio-pet:state", onPetState);
    view?.removeEventListener("resize", onResize);
    view?.removeEventListener("scroll", onScroll);
    view?.visualViewport?.removeEventListener("resize", onResize);
    view?.visualViewport?.removeEventListener("scroll", onResize);
    launcher.remove();
    dismissButton.remove();
    restoreButton.remove();
  };
}
