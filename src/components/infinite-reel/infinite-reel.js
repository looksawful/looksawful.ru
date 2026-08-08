const INFINITE_REEL_DESTROY = Symbol.for("looksawful.infiniteReel.destroy");
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const noop = () => {};

function createClone(item) {
  const clone = item.cloneNode(true);

  clone.setAttribute("aria-hidden", "true");
  clone.dataset.infiniteReelClone = "";

  clone.querySelectorAll("[id]").forEach((element) => {
    element.removeAttribute("id");
  });

  return clone;
}

export function createInfiniteReel(element, { motion } = {}) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  element[INFINITE_REEL_DESTROY]?.();

  const track = element.querySelector(":scope > [data-infinite-reel-track]");

  if (!(track instanceof HTMLElement)) {
    return null;
  }

  const mediaQuery = window.matchMedia?.(REDUCED_MOTION_QUERY) ?? null;

  let destroyed = false;
  let motionAllowed = motion?.allowsMotion?.() ?? !mediaQuery?.matches;

  const removeClones = () => {
    track.querySelectorAll("[data-infinite-reel-clone]").forEach((clone) => {
      clone.remove();
    });
  };

  const reset = () => {
    removeClones();
    element.removeAttribute("data-animated");
  };

  const refresh = () => {
    reset();

    if (destroyed || !motionAllowed) {
      return;
    }

    const sourceItems = Array.from(track.children).filter(
      (item) => item instanceof HTMLElement && !item.dataset.infiniteReelClone,
    );

    if (sourceItems.length === 0) {
      return;
    }

    const fragment = document.createDocumentFragment();

    sourceItems.forEach((item) => {
      fragment.append(createClone(item));
    });

    track.append(fragment);
    element.dataset.animated = "true";
  };

  const unsubscribeMotion =
    motion?.subscribe?.(({ allowed }) => {
      motionAllowed = Boolean(allowed);
      refresh();
    }) ?? noop;

  const handleMotionChange = (event) => {
    motionAllowed = !event.matches;
    refresh();
  };

  if (!motion?.subscribe) {
    mediaQuery?.addEventListener("change", handleMotionChange);
  }

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    unsubscribeMotion();

    if (!motion?.subscribe) {
      mediaQuery?.removeEventListener("change", handleMotionChange);
    }

    reset();

    if (element[INFINITE_REEL_DESTROY] === destroy) {
      delete element[INFINITE_REEL_DESTROY];
    }
  };

  element[INFINITE_REEL_DESTROY] = destroy;
  refresh();

  return destroy;
}

export function createInfiniteReels({ root = document, motion } = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return noop;
  }

  const destroys = Array.from(
    root.querySelectorAll("[data-infinite-reel]"),
    (element) => createInfiniteReel(element, { motion }),
  ).filter(Boolean);

  return () => {
    while (destroys.length > 0) {
      destroys.pop()?.();
    }
  };
}
