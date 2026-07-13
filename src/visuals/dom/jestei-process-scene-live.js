import { mountJesteiProcessScene as mountScene } from "./jestei-process-scene.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const CARD_SELECTOR = "#jestei-results .jestei-bento__card--manual";
const VISUAL_SELECTOR = ".jestei-bento__process-visual";

export function mountJesteiProcessScene(root = document) {
  const doc = root.ownerDocument || root;
  const win = doc.defaultView || window;
  const originalMatchMedia = win.matchMedia?.bind(win);

  root.querySelectorAll(CARD_SELECTOR).forEach((card) => {
    card.querySelector(VISUAL_SELECTOR)?.remove();
  });

  if (!originalMatchMedia) {
    mountScene(root);
    return;
  }

  win.matchMedia = (query) => {
    const result = originalMatchMedia(query);
    if (query !== REDUCED_MOTION_QUERY) return result;

    return new Proxy(result, {
      get(target, property) {
        if (property === "matches") return false;
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  };

  try {
    mountScene(root);
  } finally {
    win.matchMedia = originalMatchMedia;
  }
}
