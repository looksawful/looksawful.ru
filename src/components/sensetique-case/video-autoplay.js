const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const noop = () => {};

export function createViewportVideoPlayback(
  scene,
  { motion, accordionRuntime, signal } = {},
) {
  const videos = [...scene.querySelectorAll("video[data-sensetique-autoplay]")];
  if (!videos.length) return noop;

  const visible = new WeakMap();
  videos.forEach((video) => {
    visible.set(video, false);
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = false;
    video.pause();
  });

  const state = {
    sceneActive: accordionRuntime
      ? false
      : scene.querySelector(".cv-item__header")?.getAttribute("aria-expanded") === "true",
    documentVisible: accordionRuntime
      ? accordionRuntime.documentVisible
      : document.visibilityState !== "hidden",
    motionAllowed:
      typeof motion?.allowsMotion === "function"
        ? motion.allowsMotion()
        : !window.matchMedia?.(REDUCED_MOTION_QUERY).matches,
  };

  const syncVideo = (video) => {
    const shouldPlay =
      visible.get(video) === true &&
      state.sceneActive &&
      state.documentVisible &&
      state.motionAllowed;

    if (!shouldPlay) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    playPromise?.catch?.(noop);
  };

  const syncAll = () => videos.forEach(syncVideo);

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.target instanceof HTMLVideoElement) {
                visible.set(
                  entry.target,
                  entry.isIntersecting && entry.intersectionRatio >= 0.15,
                );
              }
            });
            syncAll();
          },
          { threshold: [0, 0.15, 0.5] },
        )
      : null;

  if (observer) videos.forEach((video) => observer.observe(video));
  else videos.forEach((video) => visible.set(video, true));

  const unsubscribeScene =
    accordionRuntime?.subscribeScene?.(scene, ({ active, documentVisible }) => {
      state.sceneActive = active;
      state.documentVisible = documentVisible;
      syncAll();
    }) ?? noop;

  const unsubscribeMotion =
    motion?.subscribe?.(
      ({ allowed }) => {
        state.motionAllowed = allowed === true;
        syncAll();
      },
      { immediate: false },
    ) ?? noop;

  if (!accordionRuntime) {
    document.addEventListener(
      "visibilitychange",
      () => {
        state.documentVisible = document.visibilityState !== "hidden";
        state.sceneActive =
          scene.querySelector(".cv-item__header")?.getAttribute("aria-expanded") === "true";
        syncAll();
      },
      { signal },
    );
  }

  syncAll();

  return () => {
    observer?.disconnect();
    unsubscribeScene();
    unsubscribeMotion();
    videos.forEach((video) => video.pause());
  };
}
