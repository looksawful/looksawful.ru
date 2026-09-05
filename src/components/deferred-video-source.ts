export function hydrateDeferredVideoSource(video: HTMLVideoElement): boolean {
  if (!video.hasAttribute("data-autoplay-deferred")) return false;

  const directSrc = video.dataset.autoplaySrc;
  if (directSrc) {
    video.src = directSrc;
    delete video.dataset.autoplaySrc;
  }

  video.querySelectorAll<HTMLSourceElement>("source[data-autoplay-src]").forEach((source) => {
    const src = source.dataset.autoplaySrc;
    if (!src) return;
    source.src = src;
    delete source.dataset.autoplaySrc;
  });

  const preload = video.dataset.autoplayPreload;
  if (preload === "" || preload === "metadata" || preload === "auto" || preload === "none") {
    video.preload = preload;
  }
  delete video.dataset.autoplayPreload;
  video.removeAttribute("data-autoplay-deferred");
  return true;
}
