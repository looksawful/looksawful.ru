const TAG_NAME = "awful-tool-preview";
const INSTANCE = Symbol.for("looksawful.awfulToolPreview.instance");
const AWFUL_CASES_MODULE_URL = "/pets/awful-cases/awful-cases.js";

const noop = () => {};
let accordionRuntime = null;

const emptyRuntime = Object.freeze({
  setActive: noop,
  destroy: noop,
});

async function importPublicModule(url) {
  if (!import.meta.env.DEV) {
    return import(/* @vite-ignore */ url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  const blobUrl = URL.createObjectURL(
    new Blob([await response.text()], {
      type: "text/javascript",
    }),
  );

  try {
    return await import(/* @vite-ignore */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function enhanceCopyButtons(root) {
  const cleanups = [];
  const timers = new Set();

  root.querySelectorAll("[data-copy-target]").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;

    const originalLabel = button.textContent.trim() || "Copy";

    const restoreLabel = () => {
      button.classList.remove("is-copied");
      button.textContent = originalLabel;
    };

    const handleClick = async () => {
      const targetId = button.dataset.copyTarget;
      const target = targetId
        ? root.querySelector(`#${CSS.escape(targetId)}`)
        : null;

      if (!(target instanceof HTMLElement)) return;

      const text = target.textContent.trim();

      try {
        await navigator.clipboard.writeText(text);
        button.classList.add("is-copied");
        button.textContent = "Copied";

        const timer = window.setTimeout(() => {
          timers.delete(timer);
          restoreLabel();
        }, 1000);
        timers.add(timer);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(target);

        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    };

    button.addEventListener("click", handleClick);
    cleanups.push(() => button.removeEventListener("click", handleClick));
  });

  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
    cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
  };
}

function createPreviewActivation(root, onChange, runtime = accordionRuntime) {
  if (!runtime?.subscribeScene) {
    onChange(false);
    return noop;
  }

  const intersectionObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            visible = entries.some(
              (entry) => entry.target === root && entry.isIntersecting,
            );
            reconcile();
          },
          { rootMargin: "120px 0px", threshold: 0.01 },
        )
      : null;

  let visible = !intersectionObserver;
  let sceneActive = false;
  let documentVisible = runtime.documentVisible;
  let active = null;

  function reconcile() {
    const nextActive =
      visible && sceneActive && documentVisible && root.isConnected;

    if (nextActive === active) return;
    active = nextActive;
    onChange(active);
  }

  intersectionObserver?.observe(root);

  const unsubscribeScene = runtime.subscribeScene(root, (state) => {
    sceneActive = state.active;
    documentVisible = state.documentVisible;
    reconcile();
  });

  reconcile();

  return () => {
    intersectionObserver?.disconnect();
    unsubscribeScene();
    onChange(false);
  };
}

function enhanceAwfulCasesPreview(root) {
  const gameRoot = root.querySelector("[data-awful-cases]");
  const previewVideo = root.querySelector("[data-awful-cases-preview-video]");
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

  if (!(gameRoot instanceof HTMLElement)) return emptyRuntime;

  let runtime = emptyRuntime;
  let pending = null;
  let active = false;
  let destroyed = false;

  function syncVideo() {
    if (!(previewVideo instanceof HTMLVideoElement)) return;

    previewVideo.muted = true;

    if (!active || reducedMotion?.matches) {
      previewVideo.pause();
      return;
    }

    void previewVideo.play().catch(noop);
  }

  async function ensureRuntime() {
    if (destroyed || pending) return pending;

    pending = importPublicModule(AWFUL_CASES_MODULE_URL)
      .then(({ enhanceAwfulCases }) => {
        if (destroyed) return;
        runtime = enhanceAwfulCases(gameRoot);
        runtime.setActive(active);
      })
      .catch((error) => {
        pending = null;
        console.error("Awful Cases failed to load", error);
      });

    return pending;
  }

  const handleMotionChange = () => syncVideo();
  reducedMotion?.addEventListener?.("change", handleMotionChange);

  return {
    setActive(nextActive) {
      active = nextActive;
      syncVideo();

      if (!active) {
        runtime.setActive(false);
        return;
      }

      void ensureRuntime();
    },
    destroy() {
      destroyed = true;
      active = false;
      if (previewVideo instanceof HTMLVideoElement) previewVideo.pause();
      reducedMotion?.removeEventListener?.("change", handleMotionChange);
      runtime.destroy();
      runtime = emptyRuntime;
      pending = null;
    },
  };
}

function enhanceAwfulToolPreview(root, runtime = accordionRuntime) {
  const project = root.getAttribute("project") || root.dataset.awfulTool || "";
  const cleanups = [enhanceCopyButtons(root)];
  const activeRuntimes = [];

  if (project === "awful-cases") {
    activeRuntimes.push(enhanceAwfulCasesPreview(root));
  }

  if (activeRuntimes.length > 0) {
    cleanups.push(
      createPreviewActivation(
        root,
        (active) => {
          activeRuntimes.forEach((itemRuntime) => itemRuntime.setActive(active));
        },
        runtime,
      ),
    );
    cleanups.push(() => {
      activeRuntimes
        .splice(0)
        .reverse()
        .forEach((itemRuntime) => itemRuntime.destroy());
    });
  }

  root.dataset.awfulToolReady = "";

  return {
    destroy() {
      root.removeAttribute("data-awful-tool-ready");
      cleanups.splice(0).reverse().forEach((cleanup) => cleanup());
    },
  };
}

class AwfulToolPreview extends HTMLElement {
  connectedCallback() {
    this[INSTANCE]?.destroy();
    this[INSTANCE] = enhanceAwfulToolPreview(this, accordionRuntime);
  }

  disconnectedCallback() {
    this[INSTANCE]?.destroy();
    delete this[INSTANCE];
  }
}

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, AwfulToolPreview);
}

export function setAwfulToolsAccordionRuntime(runtime, root = document) {
  accordionRuntime = runtime ?? null;

  root.querySelectorAll?.(TAG_NAME).forEach((element) => {
    if (!(element instanceof AwfulToolPreview) || !element.isConnected) return;
    element[INSTANCE]?.destroy();
    element[INSTANCE] = enhanceAwfulToolPreview(element, accordionRuntime);
  });
}

export { AwfulToolPreview };
