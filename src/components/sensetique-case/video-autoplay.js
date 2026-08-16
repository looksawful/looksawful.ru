const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const noop = () => {};

export function createViewportVideoPlayback(scene, { motion, signal } = {}) {
  const videos = [...scene.querySelectorAll("video[data-sensetique-autoplay]")];
  if (!videos.length) return noop;

  const visible = new WeakMap();
  const state = {
    documentVisible: document.visibilityState !== "hidden",
    motionAllowed:
      typeof motion?.allowsMotion === "function"
        ? motion.allowsMotion()
        : !window.matchMedia?.(REDUCED_MOTION_QUERY).matches,
  };

  videos.forEach((video) => {
    visible.set(video, false);
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = false;
    video.pause();
  });

  const syncVideo = (video) => {
    const shouldPlay =
      visible.get(video) === true &&
      state.documentVisible &&
      state.motionAllowed;

    if (!shouldPlay) {
      video.pause();
      return;
    }

    video.play()?.catch?.(noop);
  };

  const syncAll = () => videos.forEach(syncVideo);

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!(entry.target instanceof HTMLVideoElement)) return;
              visible.set(
                entry.target,
                entry.isIntersecting && entry.intersectionRatio >= 0.15,
              );
              syncVideo(entry.target);
            });
          },
          { threshold: [0, 0.15, 0.5] },
        )
      : null;

  if (observer) videos.forEach((video) => observer.observe(video));
  else videos.forEach((video) => visible.set(video, true));

  const unsubscribeMotion =
    motion?.subscribe?.(
      ({ allowed }) => {
        state.motionAllowed = allowed === true;
        syncAll();
      },
      { immediate: false },
    ) ?? noop;

  document.addEventListener(
    "visibilitychange",
    () => {
      state.documentVisible = document.visibilityState !== "hidden";
      syncAll();
    },
    { signal },
  );

  syncAll();

  return () => {
    observer?.disconnect();
    unsubscribeMotion();
    videos.forEach((video) => video.pause());
  };
}
