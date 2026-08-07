import { MEDIA_MANIFEST } from "../../generated/media-manifest.js";

const MEDIA_ITEM_INSTANCE = Symbol("media-item-instance");

function dispatch(root, name, detail) {
  root.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      detail,
    }),
  );
}

function assetFromRoot(root) {
  if (root instanceof HTMLImageElement || root instanceof HTMLVideoElement) {
    return root;
  }

  return root.querySelector(
    "[data-media-asset], img[data-media-id], video[data-media-id]",
  );
}

function ensureSurface(root, asset) {
  if (root instanceof HTMLImageElement || root instanceof HTMLVideoElement) {
    return null;
  }

  const existing = root.querySelector(":scope > [data-media-surface]");

  if (existing) return existing;

  const surface = document.createElement("div");
  surface.className = "media-item__surface";
  surface.dataset.mediaSurface = "";

  asset.replaceWith(surface);
  surface.append(asset);
  root.prepend(surface);
  return surface;
}

function ensureSkeleton(root, surface) {
  if (!surface) return null;

  const existing = surface.querySelector(":scope > [data-media-skeleton]");

  if (existing) return existing;

  const skeleton = document.createElement("span");
  skeleton.className = "media-item__skeleton";
  skeleton.dataset.mediaSkeleton = "";
  skeleton.setAttribute("aria-hidden", "true");
  skeleton.dataset.mediaItemGenerated = "";
  surface.append(skeleton);
  return skeleton;
}

function ensureCaption(root) {
  if (!(root instanceof HTMLElement) || root.tagName !== "FIGURE") {
    return null;
  }

  const existing = root.querySelector(":scope > [data-media-caption]");

  if (existing) return existing;

  const caption = document.createElement("figcaption");
  caption.className = "media-item__caption";
  caption.dataset.mediaCaption = "";
  caption.dataset.mediaItemGenerated = "";
  caption.hidden = true;
  root.append(caption);
  return caption;
}

function stateDetail(root, entry, state) {
  return {
    mediaId: root.dataset.mediaId ?? entry?.id ?? "",
    type: entry?.type ?? root.dataset.mediaType ?? "",
    state,
  };
}

function setState(root, entry, state, eventName = null) {
  root.dataset.mediaState = state;

  if (eventName) {
    dispatch(root, eventName, stateDetail(root, entry, state));
  }
}

function applyFrameRatio(root) {
  const token = root.dataset.mediaFrameRatio;
  const match = /^(\d+)x(\d+)$/.exec(String(token ?? ""));

  if (!match) return;

  const width = Number(match[1]);
  const height = Number(match[2]);

  if (width > 0 && height > 0) {
    root.style.setProperty("--media-item-frame-ratio", `${width} / ${height}`);
  }
}

function applyCaption(caption, entry) {
  if (!caption) return;

  // If the caption was placed manually in HTML (no generated marker),
  // leave its content alone — the author controls it via HTML.
  if (caption.dataset.mediaItemGenerated === undefined) return;

  const value = String(entry?.content?.caption ?? "").trim();

  if (!value) {
    caption.textContent = "";
    caption.hidden = true;
    return;
  }

  caption.textContent = value;
  caption.hidden = false;
}

function applyImageData(root, image, entry) {
  if (entry.default?.src) {
    image.src = entry.default.src;
  }

  if (entry.default?.width) {
    image.width = entry.default.width;
  }

  if (entry.default?.height) {
    image.height = entry.default.height;
  }

  if (Array.isArray(entry.srcset) && entry.srcset.length > 0) {
    image.srcset = entry.srcset
      .map((variant) => `${variant.src} ${variant.width}w`)
      .join(", ");
  }

  if (entry.content?.alt && !image.alt) {
    image.alt = entry.content.alt;
  }

  root.style.setProperty(
    "--media-item-source-ratio",
    `${entry.width} / ${entry.height}`,
  );
}

function applyVideoData(root, video, entry) {
  if (entry.default?.src) {
    video.src = entry.default.src;
  }

  if (entry.poster?.src && !video.poster) {
    video.poster = entry.poster.src;
  }

  if (entry.width) video.width = entry.width;
  if (entry.height) video.height = entry.height;

  if (entry.width && entry.height) {
    root.style.setProperty(
      "--media-item-source-ratio",
      `${entry.width} / ${entry.height}`,
    );
  }
}

function setExactImageSize(image, root, entry) {
  if (!(image instanceof HTMLImageElement)) {
    return () => {};
  }

  const target =
    root instanceof HTMLImageElement || root instanceof HTMLVideoElement
      ? root.parentElement
      : root;

  if (!target) return () => {};

  let frame = 0;

  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const width = Math.max(
        1,
        Math.ceil(target.getBoundingClientRect().width),
      );

      image.sizes = `${width}px`;
    });
  };

  update();

  if (typeof ResizeObserver !== "function") {
    window.addEventListener("resize", update, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }

  const observer = new ResizeObserver(update);
  observer.observe(target);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
}

export function createMediaItem({ root, manifest = MEDIA_MANIFEST } = {}) {
  if (!(root instanceof HTMLElement)) return null;

  if (root[MEDIA_ITEM_INSTANCE]) {
    return root[MEDIA_ITEM_INSTANCE];
  }

  const asset = assetFromRoot(root);
  const mediaId = root.dataset.mediaId ?? asset?.dataset.mediaId ?? "";

  if (!asset || !mediaId) {
    root.dataset.mediaState = "empty";
    return null;
  }

  const entry = manifest[mediaId];

  if (!entry) {
    root.dataset.mediaState = "error";
    root.dataset.mediaError = "manifest-entry-missing";
    return null;
  }

  root.dataset.mediaId = mediaId;
  root.dataset.mediaType = entry.type;
  root.dataset.mediaSourceRatio = entry.ratio;
  applyFrameRatio(root);

  if (!root.dataset.mediaState) {
    root.dataset.mediaState = "idle";
  }

  asset.dataset.mediaAsset = "";
  const surface = ensureSurface(root, asset);
  const skeleton = ensureSkeleton(root, surface);
  const caption = ensureCaption(root);
  const cleanups = [];
  let fallbackAttempted = false;
  let destroyed = false;

  applyCaption(caption, entry);

  const ready = async () => {
    if (destroyed) return;

    if (asset instanceof HTMLImageElement && asset.decode) {
      try {
        await asset.decode();
      } catch {
        // A successful load event is enough when decode is unavailable.
      }
    }

    if (destroyed) return;
    setState(root, entry, "ready", "media-item:ready");
  };

  const fail = () => {
    if (
      !fallbackAttempted &&
      asset instanceof HTMLImageElement &&
      entry.fallback?.src
    ) {
      fallbackAttempted = true;
      asset.removeAttribute("srcset");
      asset.removeAttribute("sizes");
      asset.src = entry.fallback.src;
      setState(root, entry, "loading");
      return;
    }

    setState(root, entry, "error", "media-item:error");
    if (caption) caption.hidden = true;
  };

  const load = () => {
    setState(root, entry, "loading", "media-item:loadstart");

    if (asset instanceof HTMLImageElement) {
      applyImageData(root, asset, entry);
      cleanups.push(setExactImageSize(asset, root, entry));

      if (asset.complete && asset.naturalWidth > 0) {
        void ready();
      }
    } else if (asset instanceof HTMLVideoElement) {
      applyVideoData(root, asset, entry);

      if (asset.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        void ready();
      }
    }
  };

  if (asset instanceof HTMLImageElement) {
    asset.addEventListener("load", ready);
    asset.addEventListener("error", fail);
    cleanups.push(() => {
      asset.removeEventListener("load", ready);
      asset.removeEventListener("error", fail);
    });
  }

  if (asset instanceof HTMLVideoElement) {
    const onPlay = () => {
      setState(root, entry, "playing", "media-item:play");
    };
    const onPause = () => {
      if (!asset.ended) {
        setState(root, entry, "paused", "media-item:pause");
      }
    };
    const onEnded = () => {
      setState(root, entry, "ended", "media-item:ended");
    };

    asset.addEventListener("loadeddata", ready);
    asset.addEventListener("error", fail);
    asset.addEventListener("play", onPlay);
    asset.addEventListener("pause", onPause);
    asset.addEventListener("ended", onEnded);

    cleanups.push(() => {
      asset.removeEventListener("loadeddata", ready);
      asset.removeEventListener("error", fail);
      asset.removeEventListener("play", onPlay);
      asset.removeEventListener("pause", onPause);
      asset.removeEventListener("ended", onEnded);
    });
  }

  const controller = Object.freeze({
    load,
    retry() {
      fallbackAttempted = false;
      delete root.dataset.mediaError;
      load();
    },
    getState() {
      return Object.freeze({
        mediaId,
        type: entry.type,
        state: root.dataset.mediaState ?? "idle",
      });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;

      while (cleanups.length) {
        cleanups.pop()?.();
      }

      for (const generated of root.querySelectorAll(
        "[data-media-item-generated]",
      )) {
        generated.remove();
      }

      if (root[MEDIA_ITEM_INSTANCE] === controller) {
        delete root[MEDIA_ITEM_INSTANCE];
      }
    },
  });

  root[MEDIA_ITEM_INSTANCE] = controller;
  load();
  return controller;
}

export function createMediaItems({
  root = document,
  manifest = MEDIA_MANIFEST,
} = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return () => {};
  }

  const instances = new Map();

  const mountWithin = (scope) => {
    const candidates = [];

    if (scope instanceof HTMLElement && scope.matches("[data-media-item]")) {
      candidates.push(scope);
    }

    candidates.push(...(scope.querySelectorAll?.("[data-media-item]") ?? []));

    for (const candidate of candidates) {
      if (instances.has(candidate)) continue;

      const instance = createMediaItem({
        root: candidate,
        manifest,
      });

      if (instance) instances.set(candidate, instance);
    }
  };

  mountWithin(root);

  const observer =
    typeof MutationObserver === "function"
      ? new MutationObserver((records) => {
          for (const record of records) {
            for (const node of record.addedNodes) {
              if (node instanceof HTMLElement) mountWithin(node);
            }

            for (const node of record.removedNodes) {
              if (!(node instanceof HTMLElement)) continue;

              for (const [element, instance] of instances) {
                if (element === node || node.contains(element)) {
                  instance.destroy();
                  instances.delete(element);
                }
              }
            }
          }
        })
      : null;

  observer?.observe(root === document ? document.documentElement : root, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer?.disconnect();

    for (const instance of instances.values()) {
      instance.destroy();
    }

    instances.clear();
  };
}

const AUTO_MOUNT_KEY = Symbol.for("looksawful.media-item.auto-mount");

if (typeof document !== "undefined" && !globalThis[AUTO_MOUNT_KEY]) {
  const start = () => {
    const destroy = createMediaItems({
      root: document,
      manifest: MEDIA_MANIFEST,
    });

    globalThis[AUTO_MOUNT_KEY] = destroy;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      globalThis[AUTO_MOUNT_KEY]?.();
      delete globalThis[AUTO_MOUNT_KEY];
    });
  }
}
