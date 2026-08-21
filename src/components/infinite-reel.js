const noop = () => {};

const SPEED_PROPERTY = "--infinite-reel-speed";
const DURATION_PROPERTY = "--infinite-reel-duration";
const VIEWPORT_MARGIN = "50% 0px";

const animationMinInlineSize = () => {
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return 48 * rootFontSize;
};

function cloneItem(item) {
  const clone = item.cloneNode(true);
  clone.setAttribute("data-infinite-reel-clone", "");
  clone.setAttribute("aria-hidden", "true");

  clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));

  return clone;
}

function readPositiveNumber(element, property) {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(property));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getCycleDistance(track) {
  const trackStyle = getComputedStyle(track);
  const gap = Number.parseFloat(trackStyle.columnGap) || 0;
  const trackWidth = track.scrollWidth;

  if (!Number.isFinite(trackWidth) || trackWidth <= 0) return null;

  return trackWidth / 2 + gap / 2;
}

export function createInfiniteReel(root, { motion } = {}) {
  if (!(root instanceof HTMLElement)) return noop;

  const track = root.querySelector(":scope > [data-infinite-reel-track]");
  if (!(track instanceof HTMLElement)) return noop;

  const authoredDuration = root.style.getPropertyValue(DURATION_PROPERTY);
  const authoredDurationPriority = root.style.getPropertyPriority(DURATION_PROPERTY);

  let destroyed = false;
  let mounted = false;
  let allowed = motion?.allowsMotion?.() ?? true;
  let wideEnough = root.clientWidth > animationMinInlineSize();
  let nearViewport = typeof IntersectionObserver !== "function";

  const isActive = () =>
    mounted && allowed && wideEnough && nearViewport && !document.hidden;

  const autoplayVideos = () =>
    [...track.querySelectorAll("video[autoplay]")].filter(
      (video) =>
        video instanceof HTMLVideoElement &&
        !video.closest("[data-media-deck]"),
    );

  const syncVideoPlayback = (active = isActive()) => {
    autoplayVideos().forEach((video) => {
      if (active) {
        if (video.paused) video.play().catch(() => {});
        return;
      }

      if (!video.paused) video.pause();
    });
  };

  const restoreDuration = () => {
    if (authoredDuration) {
      root.style.setProperty(DURATION_PROPERTY, authoredDuration, authoredDurationPriority);
      return;
    }

    root.style.removeProperty(DURATION_PROPERTY);
  };

  const syncDuration = () => {
    if (!mounted) return;

    const speed = readPositiveNumber(root, SPEED_PROPERTY);

    if (speed === null) {
      restoreDuration();
      return;
    }

    const cycleDistance = getCycleDistance(track);

    if (cycleDistance === null) {
      restoreDuration();
      return;
    }

    const duration = cycleDistance / speed;
    root.style.setProperty(DURATION_PROPERTY, `${duration.toFixed(3)}s`);
  };

  const syncPlayback = () => {
    const active = isActive();
    root.toggleAttribute("data-infinite-reel-active", active);
    syncVideoPlayback(active);
  };

  const mount = () => {
    if (mounted || destroyed || !allowed || !wideEnough || !nearViewport) return;

    const items = [...track.children].filter(
      (item) => item instanceof HTMLElement && !item.hasAttribute("data-infinite-reel-clone"),
    );

    if (!items.length) return;

    const fragment = document.createDocumentFragment();
    items.forEach((item) => fragment.append(cloneItem(item)));
    track.append(fragment);

    mounted = true;
    root.setAttribute("data-animated", "true");
    syncDuration();
    syncPlayback();
  };

  const unmount = () => {
    track.querySelectorAll("[data-infinite-reel-clone]").forEach((clone) => clone.remove());

    mounted = false;
    root.removeAttribute("data-animated");
    syncPlayback();
    restoreDuration();
  };

  const reconcile = () => {
    if (destroyed) return;

    if (!allowed || !wideEnough) {
      if (mounted) unmount();
      else syncPlayback();
      return;
    }

    if (nearViewport) mount();
    syncPlayback();
  };

  const intersectionObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          ([entry]) => {
            nearViewport = Boolean(entry?.isIntersecting);
            reconcile();
          },
          {
            rootMargin: VIEWPORT_MARGIN,
            threshold: 0,
          },
        )
      : null;

  intersectionObserver?.observe(root);

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver((entries) => {
          const rootEntry = entries.find((entry) => entry.target === root);

          if (rootEntry) {
            const nextWideEnough = rootEntry.contentRect.width > animationMinInlineSize();

            if (nextWideEnough !== wideEnough) {
              wideEnough = nextWideEnough;
              reconcile();
            }
          }

          if (mounted) syncDuration();
        })
      : null;

  resizeObserver?.observe(root);
  resizeObserver?.observe(track);

  const handleVisibilityChange = () => {
    syncPlayback();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  const unsubscribe =
    motion?.subscribe?.(({ allowed: nextAllowed }) => {
      allowed = Boolean(nextAllowed);
      reconcile();
    }) ?? noop;

  syncPlayback();

  if (!motion?.subscribe) reconcile();

  return () => {
    destroyed = true;
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    unsubscribe();
    unmount();
  };
}

export function createInfiniteReels({ root = document, motion } = {}) {
  const destroys = [...root.querySelectorAll("[data-infinite-reel]")]
    .map((element) => createInfiniteReel(element, { motion }))
    .filter(Boolean);

  return () => destroys.splice(0).reverse().forEach((destroy) => destroy?.());
}
