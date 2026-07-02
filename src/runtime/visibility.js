import { runWhenIdle } from "./schedule.js";

function toElements(selector, root = document) {
  if (!selector || !root?.querySelectorAll) return [];
  return [...root.querySelectorAll(selector)].filter((target) => target instanceof Element);
}

export function observeVisibility(targets, callback, { rootMargin = "900px 0px", threshold = 0, once = true } = {}) {
  const elements = Array.isArray(targets) ? targets.filter((target) => target instanceof Element) : [];
  if (!elements.length || typeof callback !== "function") return null;

  let observer = null;
  const run = (entryTarget) => {
    if (once) observer?.disconnect();
    callback(entryTarget);
  };

  if (!("IntersectionObserver" in window)) {
    runWhenIdle(() => run(elements[0]));
    return null;
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          run(entry.target);
          if (once) break;
        }
      }
    },
    { rootMargin, threshold },
  );

  elements.forEach((target) => observer.observe(target));
  return observer;
}

export function runWhenNear(selector, label, task, options = {}) {
  const root = options.root || document;
  const targets = toElements(selector, root);
  if (!targets.length || typeof task !== "function") return null;

  let started = false;
  return observeVisibility(
    targets,
    () => {
      if (started) return;
      started = true;
      void task(label);
    },
    options,
  );
}
