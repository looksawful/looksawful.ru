export function observeOnceVisible(targets, callback, options = {}) {
  const elements = targets.filter((target) => target instanceof Element);

  if (!elements.length) {
    return () => {};
  }

  if (!("IntersectionObserver" in window)) {
    elements.forEach(callback);
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
  }, options);

  elements.forEach((element) => observer.observe(element));

  return () => observer.disconnect();
}
