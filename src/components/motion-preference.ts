const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
type MotionPreferenceState = {
  reduced: boolean;
  allowed: boolean;
};

type MotionPreferenceListener = (state: MotionPreferenceState) => void;

type MotionPreferenceSubscribeOptions = {
  immediate?: boolean;
};

const noop = () => {};

export function createMotionPreference() {
  if (!("matchMedia" in window)) {
    return {
      isReduced: () => true,
      allowsMotion: () => false,
      subscribe(listener: MotionPreferenceListener, { immediate = true }: MotionPreferenceSubscribeOptions = {}) {
        if (immediate && typeof listener === "function") {
          listener({ reduced: true, allowed: false });
        }
        return noop;
      },
      destroy: noop,
    };
  }

  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  const listeners = new Set<MotionPreferenceListener>();
  let reduced = media.matches;

  const getState = () => ({ reduced, allowed: !reduced });
  const notify = () => {
    const state = getState();
    for (const listener of listeners) listener(state);
  };
  const handleChange = (event: MediaQueryListEvent) => {
    reduced = event.matches;
    notify();
  };

  media.addEventListener("change", handleChange);

  return {
    isReduced: () => reduced,
    allowsMotion: () => !reduced,
    subscribe(listener: MotionPreferenceListener, { immediate = true }: MotionPreferenceSubscribeOptions = {}) {
      if (typeof listener !== "function") return noop;
      listeners.add(listener);
      if (immediate) listener(getState());
      return () => listeners.delete(listener);
    },
    destroy() {
      media.removeEventListener("change", handleChange);
      listeners.clear();
      reduced = true;
    },
  };
}
