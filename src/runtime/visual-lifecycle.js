const lifecycleStore = new WeakMap();

export function cleanupElement(element) {
  if (!(element instanceof Element)) return;

  const cleanup = lifecycleStore.get(element);
  if (typeof cleanup === "function") {
    try {
      cleanup();
    } catch (error) {
      console.error("[visual-lifecycle] cleanup failed", error);
    }
  }

  lifecycleStore.delete(element);
}

export function mountOnce(element, mount) {
  if (!(element instanceof Element) || typeof mount !== "function") return null;

  if (lifecycleStore.has(element)) {
    return lifecycleStore.get(element);
  }

  const cleanup = mount(element);
  lifecycleStore.set(element, typeof cleanup === "function" ? cleanup : null);
  return cleanup;
}

export function cleanupMount(element) {
  cleanupElement(element);
}

export function createVisualLifecycleRegistry() {
  const mounted = new Set();

  return {
    mount(element, mount) {
      if (!(element instanceof Element)) return null;
      mounted.add(element);
      return mountOnce(element, mount);
    },
    cleanup(element) {
      if (!(element instanceof Element)) return;
      cleanupElement(element);
      mounted.delete(element);
    },
    cleanupAll() {
      for (const element of mounted) cleanupElement(element);
      mounted.clear();
    },
    get size() {
      return mounted.size;
    },
  };
}

export function cleanupVisualLifecycles(root = document) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll("[data-visual-demo], [data-animation], canvas[data-animation-scene]").forEach(cleanupElement);
}
