const DEFAULT_OBSERVER_OPTIONS = {
  root: null,
  rootMargin: "240px 0px",
  threshold: 0.01,
};

export function observeOnceVisible(targets, callback, options = {}) {
  const elements = [...targets].filter((target) => target instanceof Element);

  if (!elements.length) {
    return () => {};
  }

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => callback(element));
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      observer.unobserve(entry.target);
      callback(entry.target);
    });
  }, {
    ...DEFAULT_OBSERVER_OPTIONS,
    ...options,
  });

  elements.forEach((element) => observer.observe(element));

  return () => observer.disconnect();
}

