type Destroy = () => void;

type MotionPreferenceLike = {
  allowsMotion(): boolean;
};

type FrameCallback = (timestamp: number) => void;

type OneShotRevealOptions = {
  min: number;
  max: number;
  durationMs: number;
  allowsMotion: () => boolean;
  setValue: (value: number) => void;
  requestFrame: (callback: FrameCallback) => number;
  cancelFrame: (id: number) => void;
};

type InitBeforeAfterOptions = {
  motion: MotionPreferenceLike;
  autoReveal?: boolean;
};

const AUTO_REVEAL_DURATION_MS = 1200;
const AUTO_REVEAL_THRESHOLD = 0.35;
const noop: Destroy = () => {};

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function createBeforeAfterOneShotReveal({
  min,
  max,
  durationMs,
  allowsMotion,
  setValue,
  requestFrame,
  cancelFrame,
}: OneShotRevealOptions) {
  let played = false;
  let active = false;
  let frameId: number | null = null;
  let startedAt: number | null = null;

  const stop = (): void => {
    if (frameId !== null) cancelFrame(frameId);
    frameId = null;
    startedAt = null;
    active = false;
  };

  const cancel = (): void => {
    played = true;
    stop();
  };

  const tick = (timestamp: number): void => {
    if (!active) return;
    if (!allowsMotion()) {
      cancel();
      return;
    }

    startedAt ??= timestamp;
    const progress = clampUnit((timestamp - startedAt) / durationMs);
    const value = min + (max - min) * easeInOutCubic(progress);
    setValue(value);

    if (progress >= 1) {
      frameId = null;
      startedAt = null;
      active = false;
      return;
    }

    frameId = requestFrame(tick);
  };

  const enterViewport = (): void => {
    if (played) return;
    played = true;

    if (!allowsMotion() || !Number.isFinite(min) || !Number.isFinite(max) || max <= min || durationMs <= 0) {
      return;
    }

    active = true;
    setValue(min);
    frameId = requestFrame(tick);
  };

  return {
    enterViewport,
    cancel,
    hasPlayed: () => played,
    isActive: () => active,
  };
}

export function initBeforeAfter(
  root: Element,
  { motion, autoReveal = false }: InitBeforeAfterOptions,
): Destroy {
  if (!(root instanceof HTMLElement)) return noop;

  const range = root.querySelector<HTMLInputElement>(".before-after__range");
  if (!(range instanceof HTMLInputElement)) return noop;

  const render = (): void => {
    root.style.setProperty("--before-after-split", `${range.value}%`);
  };

  const min = Number(range.min);
  const max = Number(range.max);
  const reveal = createBeforeAfterOneShotReveal({
    min,
    max,
    durationMs: AUTO_REVEAL_DURATION_MS,
    allowsMotion: () => motion.allowsMotion(),
    setValue: (value) => {
      range.value = String(value);
      render();
    },
    requestFrame: (callback) => window.requestAnimationFrame(callback),
    cancelFrame: (id) => window.cancelAnimationFrame(id),
  });

  const handleManualStart = (): void => reveal.cancel();
  const handleInput = (): void => {
    reveal.cancel();
    render();
  };

  range.addEventListener("pointerdown", handleManualStart, { passive: true });
  range.addEventListener("keydown", handleManualStart);
  range.addEventListener("input", handleInput, { passive: true });
  render();

  let observer: IntersectionObserver | null = null;
  if (autoReveal && typeof IntersectionObserver === "function") {
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some(
          (entry) =>
            entry.target === root &&
            entry.isIntersecting &&
            entry.intersectionRatio >= AUTO_REVEAL_THRESHOLD,
        );
        if (!visible) return;

        observer?.disconnect();
        observer = null;
        reveal.enterViewport();
      },
      { threshold: AUTO_REVEAL_THRESHOLD },
    );
    observer.observe(root);
  }

  return () => {
    observer?.disconnect();
    reveal.cancel();
    range.removeEventListener("pointerdown", handleManualStart);
    range.removeEventListener("keydown", handleManualStart);
    range.removeEventListener("input", handleInput);
  };
}
