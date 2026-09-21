type MediaRuntimeRoot = ParentNode & Node;

const noop = () => {};

function isVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element.closest("[hidden]")) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

function primeVideo(video: Element): void {
  if (!(video instanceof HTMLVideoElement) || !isVisible(video)) return;
  if (video.hasAttribute("data-autoplay-deferred") || video.hasAttribute("data-media-video-fallback")) return;
  if (video.hasAttribute("autoplay")) {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
  }
  if (!video.poster && video.preload !== "auto") video.preload = "auto";
  if (video.readyState === HTMLMediaElement.HAVE_NOTHING) video.load();
  if (video.hasAttribute("autoplay") && video.paused && !document.hidden) video.play().catch(() => {});
}

function showVideoPosterFallback(video: HTMLVideoElement): void {
  if (video.hasAttribute("data-media-video-fallback") || !video.poster) return;

  video.setAttribute("data-media-video-fallback", "");
  video.pause();
  video.removeAttribute("autoplay");
  video.preload = "none";
  video.removeAttribute("src");
  video.querySelectorAll("source").forEach((source) => source.removeAttribute("src"));
  video.load();
}

function nudgeCanvas(canvas: Element): void {
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

function refresh(root: ParentNode = document): void {
  root.querySelectorAll?.("video").forEach(primeVideo);
  root.querySelectorAll?.('[data-animated-canvas-gallery] canvas').forEach(nudgeCanvas);
}

export function createMediaRuntimeHealth({ root = document }: { root?: MediaRuntimeRoot } = {}) {
  if (!root?.querySelectorAll) return noop;
  let frame: number = 0;
  const schedule = (): void => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      refresh(root);
    });
  };
  const mutationObserver = typeof MutationObserver === "function"
    ? new MutationObserver((records: MutationRecord[]) => {
        if (records.some((record) => ["data-active", "hidden", "aria-hidden", "data-deck-view"].includes(record.attributeName ?? ""))) schedule();
      })
    : null;
  mutationObserver?.observe(root === document ? document.documentElement : root, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-active", "hidden", "aria-hidden", "data-deck-view"],
  });
  const handleVisibility = (): void => {
    if (!document.hidden) schedule();
  };
  const handleMediaError = (event: Event): void => {
    if (event.target instanceof HTMLVideoElement) showVideoPosterFallback(event.target);
  };
  window.addEventListener("pageshow", schedule);
  window.addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  root.addEventListener?.("error", handleMediaError, true);
  root.addEventListener?.("loadedmetadata", schedule, true);
  root.addEventListener?.("canplay", schedule, true);
  schedule();
  return () => {
    if (frame) cancelAnimationFrame(frame);
    mutationObserver?.disconnect();
    window.removeEventListener("pageshow", schedule);
    window.removeEventListener("resize", schedule);
    document.removeEventListener("visibilitychange", handleVisibility);
    root.removeEventListener?.("error", handleMediaError, true);
    root.removeEventListener?.("loadedmetadata", schedule, true);
    root.removeEventListener?.("canplay", schedule, true);
  };
}
