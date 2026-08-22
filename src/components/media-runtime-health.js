const noop = () => {};

function isVisible(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.closest("[hidden]")) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

function primeVideo(video) {
  if (!(video instanceof HTMLVideoElement) || !isVisible(video)) return;
  if (video.hasAttribute("autoplay")) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
  }
  if (!video.poster && video.preload !== "auto") video.preload = "auto";
  if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
  if (video.hasAttribute("autoplay") && video.paused && !document.hidden) video.play().catch(() => {});
}

function nudgeCanvas(canvas) {
  if (!(canvas instanceof HTMLCanvasElement) || !isVisible(canvas)) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);
  const expectedWidth = Math.max(1, Math.round(rect.width * dpr));
  const expectedHeight = Math.max(1, Math.round(rect.height * dpr));
  const stale =
    canvas.width <= 2 ||
    canvas.height <= 2 ||
    Math.abs(canvas.width - expectedWidth) > Math.max(4, expectedWidth * 0.08) ||
    Math.abs(canvas.height - expectedHeight) > Math.max(4, expectedHeight * 0.08);
  if (!stale) return;
  const previousInlineSize = canvas.style.inlineSize;
  canvas.style.inlineSize = `${Math.max(1, rect.width - 0.5)}px`;
  requestAnimationFrame(() => {
    canvas.style.inlineSize = previousInlineSize;
  });
}

function refresh(root = document) {
  root.querySelectorAll?.("video").forEach(primeVideo);
  root.querySelectorAll?.('[data-animated-canvas-gallery] canvas').forEach(nudgeCanvas);
}

export function createMediaRuntimeHealth({ root = document } = {}) {
  if (!root?.querySelectorAll) return noop;
  let frame = 0;
  const schedule = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      refresh(root);
    });
  };
  const mutationObserver = typeof MutationObserver === "function"
    ? new MutationObserver((records) => {
        if (records.some((record) => ["data-active", "hidden", "aria-hidden", "data-deck-view"].includes(record.attributeName ?? ""))) schedule();
      })
    : null;
  mutationObserver?.observe(root === document ? document.documentElement : root, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-active", "hidden", "aria-hidden", "data-deck-view"],
  });
  const handleVisibility = () => {
    if (!document.hidden) schedule();
  };
  window.addEventListener("pageshow", schedule);
  window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  root.addEventListener?.("loadedmetadata", schedule, true);
  root.addEventListener?.("canplay", schedule, true);
  schedule();
  return () => {
    if (frame) cancelAnimationFrame(frame);
    mutationObserver?.disconnect();
    window.removeEventListener("pageshow", schedule);
    window.removeEventListener("resize", schedule);
    document.removeEventListener("visibilitychange", handleVisibility);
    root.removeEventListener?.("loadedmetadata", schedule, true);
    root.removeEventListener?.("canplay", schedule, true);
  };
}
