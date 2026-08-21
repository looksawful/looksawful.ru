const noop = () => {};

const SPEED_PROPERTY = "--infinite-reel-speed";
const DURATION_PROPERTY = "--infinite-reel-duration";

const animationMinInlineSize = () => {
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return 48 * rootFontSize;
};

function cloneItem(item) {
  const clone = item.cloneNode(true);
  clone.setAttribute("data-infinite-reel-clone", "");
  clone.setAttribute("aria-hidden", "true");

  clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  clone.querySelectorAll("img").forEach((image) => {
    image.loading = "eager";
  });

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
  let allowed = motion?.allowsMotion?.() ?? true;
  let wideEnough = root.getBoundingClientRect().width > animationMinInlineSize();

  const restoreDuration = () => {
    if (authoredDuration) {
      root.style.setProperty(DURATION_PROPERTY, authoredDuration, authoredDurationPriority);
      return;
    }

    root.style.removeProperty(DURATION_PROPERTY);
  };

  const syncDuration = () => {
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

  const removeClones = () => {
    track.querySelectorAll("[data-infinite-reel-clone]").forEach((clone) => clone.remove());
    root.removeAttribute("data-animated");
    restoreDuration();
  };

  const refresh = () => {
    removeClones();
    if (destroyed || !allowed || !wideEnough) return;

    const items = [...track.children].filter(
      (item) => item instanceof HTMLElement && !item.hasAttribute("data-infinite-reel-clone"),
    );
    if (!items.length) return;

    const fragment = document.createDocumentFragment();
    items.forEach((item) => fragment.append(cloneItem(item)));
    track.append(fragment);
    root.setAttribute("data-animated", "true");
    syncDuration();
  };

  const unsubscribe =
    motion?.subscribe?.(({ allowed: nextAllowed }) => {
      allowed = Boolean(nextAllowed);
      refresh();
    }) ?? noop;

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          const nextWideEnough = root.getBoundingClientRect().width > animationMinInlineSize();

          if (nextWideEnough !== wideEnough) {
            wideEnough = nextWideEnough;
            refresh();
            return;
          }

          if (allowed && wideEnough && root.getAttribute("data-animated") === "true") {
            syncDuration();
          }
        })
      : null;

  resizeObserver?.observe(root);
  resizeObserver?.observe(track);

  if (!motion?.subscribe) refresh();
  else if (!allowed || !wideEnough) removeClones();

  return () => {
    destroyed = true;
    resizeObserver?.disconnect();
    unsubscribe();
    removeClones();
  };
}

export function createInfiniteReels({ root = document, motion } = {}) {
  const destroys = [...root.querySelectorAll("[data-infinite-reel]")]
    .map((element) => createInfiniteReel(element, { motion }))
    .filter(Boolean);

  return () => destroys.splice(0).reverse().forEach((destroy) => destroy?.());
}
