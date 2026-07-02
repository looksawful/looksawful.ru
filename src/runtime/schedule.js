export function runAfterFirstPaint(callback) {
  if (typeof callback !== "function") return;

  if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(callback);
    });
    return;
  }

  setTimeout(callback, 0);
}

export function runWhenIdle(callback, { timeout = 1200, fallbackDelay = 120 } = {}) {
  if (typeof callback !== "function") return;

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout });
    return;
  }

  setTimeout(callback, fallbackDelay);
}

export function runAfterDomReady(callback) {
  if (typeof callback !== "function") return;

  if (typeof document === "undefined" || document.readyState !== "loading") {
    callback();
    return;
  }

  document.addEventListener("DOMContentLoaded", callback, { once: true });
}

export function runMicrotask(callback) {
  if (typeof callback !== "function") return;

  if (typeof queueMicrotask === "function") {
    queueMicrotask(callback);
    return;
  }

  Promise.resolve().then(callback).catch((error) => {
    setTimeout(() => {
      throw error;
    }, 0);
  });
}
