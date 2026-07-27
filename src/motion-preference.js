const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const noop = () => {};

export function createMotionPreference() {
  if (!("matchMedia" in window)) {
    return {
      isReduced: () => true,
      allowsMotion: () => false,

      subscribe(listener, { immediate = true } = {}) {
        if (immediate && typeof listener === "function") {
          listener({
            reduced: true,
            allowed: false,
          });
        }

        return noop;
      },

      destroy: noop,
    };
  }

  const media = window.matchMedia(REDUCED_MOTION_QUERY);

  const listeners = new Set();

  let reduced = media.matches;

  const getState = () => ({
    reduced,
    allowed: !reduced,
  });

  const notify = () => {
    const state = getState();

    for (const listener of listeners) {
      listener(state);
    }
  };

  const handleChange = (event) => {
    reduced = event.matches;
    notify();
  };

  media.addEventListener("change", handleChange);

  return {
    isReduced() {
      return reduced;
    },

    allowsMotion() {
      return !reduced;
    },

    subscribe(listener, { immediate = true } = {}) {
      if (typeof listener !== "function") {
        return noop;
      }

      listeners.add(listener);

      if (immediate) {
        listener(getState());
      }

      return () => {
        listeners.delete(listener);
      };
    },

    destroy() {
      media.removeEventListener("change", handleChange);

      listeners.clear();
      reduced = true;
    },
  };
}
