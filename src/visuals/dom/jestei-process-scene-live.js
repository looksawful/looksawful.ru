import { mountJesteiProcessScene as mountScene } from "./jestei-process-scene.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const CARD_SELECTOR = "#jestei-results .jestei-bento__card--manual";
const VISUAL_SELECTOR = ".jestei-bento__process-visual";

export function mountJesteiProcessScene(root = document) {
  const doc = root.ownerDocument || root;
  const win = doc.defaultView || window;
  const originalMatchMedia = win.matchMedia?.bind(win);
  const OriginalURLSearchParams = win.URLSearchParams;

  root.querySelectorAll(CARD_SELECTOR).forEach((card) => {
    card.querySelector(VISUAL_SELECTOR)?.remove();
  });

  if (originalMatchMedia) {
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
  }

  if (OriginalURLSearchParams) {
    win.URLSearchParams = class LiveProcessURLSearchParams extends OriginalURLSearchParams {
      has(name, value) {
        if (String(name) === "static") return false;
        return arguments.length > 1 ? super.has(name, value) : super.has(name);
      }
    };
  }

  try {
    mountScene(root);
  } finally {
    if (originalMatchMedia) win.matchMedia = originalMatchMedia;
    if (OriginalURLSearchParams) win.URLSearchParams = OriginalURLSearchParams;
  }
}
