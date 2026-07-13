import { mountJesteiProcessScene as mountScene } from "./jestei-process-scene.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function mountJesteiProcessScene(root = document) {
  const doc = root.ownerDocument || root;
  const win = doc.defaultView || window;
  const originalMatchMedia = win.matchMedia?.bind(win);

  if (!originalMatchMedia) {
    mountScene(root);
    return;
  }

  win.matchMedia = (query) => {
    const result = originalMatchMedia(query);
    if (query !== REDUCED_MOTION_QUERY) return result;

    return new Proxy(result, {
      get(target, property, receiver) {
        if (property === "matches") return false;
        return Reflect.get(target, property, receiver);
      },
    });
  };

  try {
    mountScene(root);
  } finally {
    win.matchMedia = originalMatchMedia;
  }
}
