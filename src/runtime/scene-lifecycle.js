const noop = () => {};

export function createSceneLifecycle({ root = document, rootMargin = "75% 0px" } = {}) {
  const scenes = [...root.querySelectorAll(".cv-item[data-cv-scene]")].filter((scene) => scene instanceof HTMLElement);
  const indexes = new WeakMap();
  const records = new Map();
  const invalidationSubscribers = new Set();
  let destroyed = false;
  let documentVisible = document.visibilityState !== "hidden";

  scenes.forEach((scene, index) => {
    indexes.set(scene, index);
    records.set(scene, { scene, index, active: false, prepared: false, sceneSubscribers: new Set(), prepareSubscribers: new Set() });
  });

  const sceneFor = (value) => {
    if (value instanceof Element) return value.closest(".cv-item[data-cv-scene]");
    return Number.isInteger(value) ? scenes[value] ?? null : null;
  };
  const recordFor = (value) => records.get(sceneFor(value)) ?? null;
  const snapshot = (record) => Object.freeze({ index: record.index, active: record.active, prepared: record.prepared, mode: "sheets", documentVisible });
  const notifyScene = (record) => record.sceneSubscribers.forEach((listener) => listener(snapshot(record)));
  const prepare = (record) => {
    if (!record || record.prepared || destroyed) return;
    record.prepared = true;
    record.prepareSubscribers.forEach((listener) => listener({ index: record.index, scene: record.scene }));
  };

  const observer = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const record = records.get(entry.target);
          if (!record) return;
          const active = entry.isIntersecting;
          if (active) prepare(record);
          if (active !== record.active) { record.active = active; notifyScene(record); }
        });
      }, { rootMargin, threshold: 0.01 })
    : null;

  if (observer) scenes.forEach((scene) => observer.observe(scene));
  else records.forEach((record) => { record.active = true; prepare(record); });

  const handleVisibilityChange = () => {
    const next = document.visibilityState !== "hidden";
    if (next === documentVisible) return;
    documentVisible = next;
    records.forEach(notifyScene);
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const subscribeScene = (value, listener, { immediate = true } = {}) => {
    const record = recordFor(value);
    if (!record || destroyed || typeof listener !== "function") return noop;
    record.sceneSubscribers.add(listener);
    if (immediate) listener(snapshot(record));
    return () => record.sceneSubscribers.delete(listener);
  };
  const subscribePrepare = (value, listener, { immediate = false } = {}) => {
    const record = recordFor(value);
    if (!record || destroyed || typeof listener !== "function") return noop;
    record.prepareSubscribers.add(listener);
    if (immediate && record.prepared) listener({ index: record.index, scene: record.scene });
    return () => record.prepareSubscribers.delete(listener);
  };
  const requestPrepare = (value) => prepare(recordFor(value));
  const invalidate = (value = -1) => {
    const record = recordFor(value);
    invalidationSubscribers.forEach((listener) => listener(record?.index ?? -1));
  };
  const subscribeInvalidation = (listener) => {
    if (destroyed || typeof listener !== "function") return noop;
    invalidationSubscribers.add(listener);
    return () => invalidationSubscribers.delete(listener);
  };
  const indexForElement = (element) => recordFor(element)?.index ?? -1;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    observer?.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    records.forEach((record) => { record.sceneSubscribers.clear(); record.prepareSubscribers.clear(); });
    invalidationSubscribers.clear();
  };

  return Object.freeze({
    get documentVisible() { return documentVisible; },
    mode: "sheets",
    indexForElement, subscribeScene, subscribePrepare, subscribeInvalidation, requestPrepare, invalidate, destroy,
  });
}
