export interface GalleryVideoPlaybackController {
  destroy(): void;
}

export function galleryVideoShouldAutoplay(
  reducedMotion: boolean,
  visibleRatio: number,
): boolean {
  return !reducedMotion && visibleRatio >= 0.6;
}

const EMPTY_CONTROLLER: GalleryVideoPlaybackController = {
  destroy: () => {},
};

export function createGalleryVideoPlayback(
  root: HTMLElement,
): GalleryVideoPlaybackController {
  const videos = [...root.querySelectorAll<HTMLVideoElement>("video[data-gallery-video]")];
  if (videos.length === 0) return EMPTY_CONTROLLER;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  const pauseAll = (): void => {
    for (const video of videos) video.pause();
  };

  for (const video of videos) {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (galleryVideoShouldAutoplay(reducedMotion, entry.intersectionRatio)) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    },
    { threshold: [0, 0.6, 1] },
  );

  for (const video of videos) observer.observe(video);

  const handleMotionChange = (event: MediaQueryListEvent): void => {
    reducedMotion = event.matches;
    if (reducedMotion) pauseAll();
  };
  motionQuery.addEventListener("change", handleMotionChange);

  if (reducedMotion) pauseAll();

  return {
    destroy: () => {
      observer.disconnect();
      motionQuery.removeEventListener("change", handleMotionChange);
      pauseAll();
    },
  };
}
