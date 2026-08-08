const MEDIA_MARQUEE_DESTROY = Symbol.for("looksawful.mediaMarquee.destroy");

const DEFAULT_SPEED = 72;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const noop = () => {};

function createClone(source) {
  const clone = source.cloneNode(true);

  const elements = [clone, ...clone.querySelectorAll("*")];

  clone.dataset.mediaMarqueeClone = "";
  clone.inert = true;

  for (const element of elements) {
    element.removeAttribute("id");
    element.removeAttribute("data-media-id");
    element.removeAttribute("data-media-item");
    element.removeAttribute("data-media-caption-for");
    element.removeAttribute("data-ref");
  }

  clone.querySelectorAll("img").forEach((image) => {
    image.alt = "";
  });

  return clone;
}

function readGap(element) {
  const styles = window.getComputedStyle(element);

  const value = Number.parseFloat(styles.columnGap || styles.gap);

  return Number.isFinite(value) ? value : 0;
}

function readSpeed(element) {
  const value = Number.parseFloat(element.dataset.mediaMarqueeSpeed);

  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SPEED;
}

export function createMediaMarquee(element, { motion } = {}) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  element[MEDIA_MARQUEE_DESTROY]?.();

  const track = element.querySelector(":scope > [data-media-marquee-track]");

  const source = track?.querySelector(
    [
      ":scope > ",
      "[data-media-marquee-group]",
      ":not([data-media-marquee-clone])",
    ].join(""),
  );

  if (!(track instanceof HTMLElement) || !(source instanceof HTMLElement)) {
    return null;
  }

  const mediaQuery = window.matchMedia?.(REDUCED_MOTION_QUERY) ?? null;

  let frame = 0;
  let destroyed = false;

  let motionAllowed = motion?.allowsMotion?.() ?? !mediaQuery?.matches;

  const removeClones = () => {
    track.querySelectorAll("[data-media-marquee-clone]").forEach((clone) => {
      clone.remove();
    });
  };

  const reset = () => {
    removeClones();

    element.removeAttribute("data-animated");
    element.removeAttribute("data-measuring");

    element.style.removeProperty("--media-marquee-distance");

    element.style.removeProperty("--media-marquee-duration");

    element.scrollLeft = 0;
  };

  const refresh = () => {
    frame = 0;

    reset();

    if (destroyed || !motionAllowed) {
      return;
    }

    element.dataset.measuring = "true";

    const viewportWidth = element.getBoundingClientRect().width;

    const sourceWidth = source.getBoundingClientRect().width;

    const gap = readGap(track);

    element.removeAttribute("data-measuring");

    if (viewportWidth <= 0 || sourceWidth <= 0) {
      return;
    }

    const distance = sourceWidth + gap;

    const groupCount = Math.max(
      2,
      Math.ceil((viewportWidth + distance + gap) / distance),
    );

    const fragment = document.createDocumentFragment();

    for (let index = 1; index < groupCount; index += 1) {
      fragment.append(createClone(source));
    }

    track.append(fragment);

    element.style.setProperty("--media-marquee-distance", `${distance}px`);

    element.style.setProperty(
      "--media-marquee-duration",
      `${distance / readSpeed(element)}s`,
    );

    element.dataset.animated = "true";
  };

  const scheduleRefresh = () => {
    if (!destroyed && !frame) {
      frame = window.requestAnimationFrame(refresh);
    }
  };

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(scheduleRefresh)
      : null;

  resizeObserver?.observe(element);
  resizeObserver?.observe(source);

  if (!resizeObserver) {
    window.addEventListener("resize", scheduleRefresh);
  }

  const unsubscribeMotion =
    motion?.subscribe?.(({ allowed }) => {
      motionAllowed = Boolean(allowed);

      scheduleRefresh();
    }) ?? noop;

  const handleMotionChange = (event) => {
    motionAllowed = !event.matches;

    scheduleRefresh();
  };

  if (!motion?.subscribe) {
    mediaQuery?.addEventListener("change", handleMotionChange);
  }

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;

    if (frame) {
      window.cancelAnimationFrame(frame);
    }

    resizeObserver?.disconnect();
    unsubscribeMotion();

    if (!resizeObserver) {
      window.removeEventListener("resize", scheduleRefresh);
    }

    if (!motion?.subscribe) {
      mediaQuery?.removeEventListener("change", handleMotionChange);
    }

    reset();

    if (element[MEDIA_MARQUEE_DESTROY] === destroy) {
      delete element[MEDIA_MARQUEE_DESTROY];
    }
  };

  element[MEDIA_MARQUEE_DESTROY] = destroy;

  scheduleRefresh();

  return destroy;
}

export function createMediaMarquees({ root = document, motion } = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return noop;
  }

  const destroys = Array.from(
    root.querySelectorAll("[data-media-marquee]"),
    (element) => createMediaMarquee(element, { motion }),
  ).filter(Boolean);

  return () => {
    while (destroys.length > 0) {
      destroys.pop()?.();
    }
  };
}
