export const has = (selector, root = document) => Boolean(root?.querySelector?.(selector));

export async function safe(label, task) {
  try {
    return await task();
  } catch (error) {
    console.error(`[init] ${label} failed`, error);
    return null;
  }
}

export function runWhenIdle(callback, timeout = 1600) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }

  window.setTimeout(callback, Math.min(timeout, 200));
}

export function runAfterFirstPaint(callback) {
  if ("requestAnimationFrame" in window) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(callback);
    });
    return;
  }

  window.setTimeout(callback, 0);
}

export function runWhenNear(selector, label, task, { root = document, rootMargin = "900px 0px", threshold = 0 } = {}) {
  const targets = [...root.querySelectorAll(selector)].filter((target) => target instanceof Element);

  if (!targets.length) {
    return false;
  }

  let started = false;
  let observer = null;

  const start = () => {
    if (started) return;

    started = true;
    observer?.disconnect();
    void safe(label, task);
  };

  if (!("IntersectionObserver" in window)) {
    runWhenIdle(start);
    return true;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        start();
      }
    },
    { rootMargin, threshold },
  );

  targets.forEach((target) => observer.observe(target));
  return true;
}