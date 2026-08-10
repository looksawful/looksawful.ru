const noop = () => {};

function normalizeIndex(index, count) {
  const value = Number(index);
  return Number.isInteger(value) && value >= 0 && value < count ? value : -1;
}

export function createCvAccordionRuntime({ records = [] } = {}) {
  const count = records.length;
  const itemIndexes = new WeakMap();
  const sceneSubscribers = Array.from({ length: count }, () => new Set());
  const frameSubscribers = Array.from({ length: count }, () => new Set());
  const prepareSubscribers = Array.from({ length: count }, () => new Set());
  const invalidationSubscribers = new Set();

  records.forEach((record, index) => {
    if (record?.item instanceof HTMLElement) itemIndexes.set(record.item, index);
  });

  let destroyed = false;
  let activeIndex = -1;
  let mode = "static";
  let documentVisible = document.visibilityState !== "hidden";
  let lastFrame = null;

  function snapshot(index) {
    return Object.freeze({
      index,
      activeIndex,
      active: index >= 0 && index === activeIndex,
      mode,
      documentVisible,
    });
  }

  function notifyScene(index) {
    if (index < 0 || index >= count) return;
    const value = snapshot(index);
    sceneSubscribers[index].forEach((listener) => listener(value));
  }

  function notifyAllScenes() {
    for (let index = 0; index < count; index += 1) notifyScene(index);
  }

  function setActiveIndex(nextIndex) {
    if (destroyed) return;
    const next = normalizeIndex(nextIndex, count);
    if (next === activeIndex) return;
    const previous = activeIndex;
    activeIndex = next;
    notifyScene(previous);
    notifyScene(next);
    if (next >= 0 && next + 1 < count) requestPrepare(next + 1);
  }

  function setMode(nextMode) {
    if (destroyed || nextMode === mode) return;
    mode = nextMode;
    notifyAllScenes();
  }

  function handleVisibilityChange() {
    const nextVisible = document.visibilityState !== "hidden";
    if (nextVisible === documentVisible) return;
    documentVisible = nextVisible;
    notifyAllScenes();
  }

  function indexForElement(element) {
    const item = element instanceof Element ? element.closest(".cv-item") : null;
    return item instanceof HTMLElement ? (itemIndexes.get(item) ?? -1) : -1;
  }

  function subscribeScene(indexOrElement, listener, { immediate = true } = {}) {
    if (destroyed || typeof listener !== "function") return noop;
    const index = indexOrElement instanceof Element
      ? indexForElement(indexOrElement)
      : normalizeIndex(indexOrElement, count);
    if (index < 0) return noop;
    sceneSubscribers[index].add(listener);
    if (immediate) listener(snapshot(index));
    return () => sceneSubscribers[index].delete(listener);
  }

  function subscribeFrame(indexOrElement, listener) {
    if (destroyed || typeof listener !== "function") return noop;
    const index = indexOrElement instanceof Element
      ? indexForElement(indexOrElement)
      : normalizeIndex(indexOrElement, count);
    if (index < 0) return noop;
    frameSubscribers[index].add(listener);
    if (lastFrame) listener(lastFrame, index);
    return () => frameSubscribers[index].delete(listener);
  }

  function publishFrame(frame, indexes = null) {
    if (destroyed || !frame) return;
    lastFrame = frame;
    const targets = indexes ?? (activeIndex >= 0 ? [activeIndex] : []);
    targets.forEach((index) => {
      if (index < 0 || index >= count) return;
      frameSubscribers[index].forEach((listener) => listener(frame, index));
    });
  }

  function subscribePrepare(indexOrElement, listener, { immediate = false } = {}) {
    if (destroyed || typeof listener !== "function") return noop;
    const index = indexOrElement instanceof Element
      ? indexForElement(indexOrElement)
      : normalizeIndex(indexOrElement, count);
    if (index < 0) return noop;
    prepareSubscribers[index].add(listener);
    if (immediate) listener({ index });
    return () => prepareSubscribers[index].delete(listener);
  }

  function requestPrepare(indexOrElement) {
    if (destroyed) return;
    const index = indexOrElement instanceof Element
      ? indexForElement(indexOrElement)
      : normalizeIndex(indexOrElement, count);
    if (index < 0) return;
    prepareSubscribers[index].forEach((listener) => listener({ index }));
  }

  function invalidate(indexOrElement = -1) {
    if (destroyed) return;
    const index = indexOrElement instanceof Element
      ? indexForElement(indexOrElement)
      : normalizeIndex(indexOrElement, count);
    invalidationSubscribers.forEach((listener) => listener(index));
  }

  function subscribeInvalidation(listener) {
    if (destroyed || typeof listener !== "function") return noop;
    invalidationSubscribers.add(listener);
    return () => invalidationSubscribers.delete(listener);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    sceneSubscribers.forEach((set) => set.clear());
    frameSubscribers.forEach((set) => set.clear());
    prepareSubscribers.forEach((set) => set.clear());
    invalidationSubscribers.clear();
    lastFrame = null;
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return Object.freeze({
    get activeIndex() { return activeIndex; },
    get mode() { return mode; },
    get documentVisible() { return documentVisible; },
    indexForElement,
    subscribeScene,
    subscribeFrame,
    subscribePrepare,
    subscribeInvalidation,
    requestPrepare,
    invalidate,
    publishFrame,
    setActiveIndex,
    setMode,
    destroy,
  });
}
