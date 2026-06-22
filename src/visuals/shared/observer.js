const hasIntersectionObserver = () => "IntersectionObserver" in globalThis;

const createObserverCleanup = (observer) => {
  const cleanup = () => observer.disconnect();
  cleanup.disconnect = () => observer.disconnect();
  cleanup.observer = observer;
  return cleanup;
};

export const toggleBodyClassByVisibility = (elements, className, options) => {
  const targets = [...elements].filter((element) => element instanceof Element);

  if (!targets.length || !hasIntersectionObserver()) {
    return () => {};
  }

  const activeElements = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeElements.add(entry.target);
      } else {
        activeElements.delete(entry.target);
      }
    });

    globalThis.document?.body?.classList.toggle(className, activeElements.size > 0);
  }, options);

  targets.forEach((element) => observer.observe(element));
  return createObserverCleanup(observer);
};

export const observeOnceVisible = (elements, onVisible, options) => {
  const targets = [...elements].filter((element) => element instanceof Element);

  if (!targets.length) {
    return () => {};
  }

  if (!hasIntersectionObserver()) {
    targets.forEach((element) => onVisible(element));
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      onVisible(entry.target, observer);
      observer.unobserve(entry.target);
    });
  }, options);

  targets.forEach((element) => observer.observe(element));
  return createObserverCleanup(observer);
};
