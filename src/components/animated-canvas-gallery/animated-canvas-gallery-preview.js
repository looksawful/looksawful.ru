import {
  loadAnimatedCanvasGalleryVariant,
} from "./animated-canvas-gallery-registry.js";

import {
  applyAnimatedCanvasGalleryPreset,
} from "./animated-canvas-gallery-presets.js";

import {
  createAnimatedCanvasGalleryControls,
} from "./preview/preview-controls.js";

const PREVIEW_DESTROY = Symbol.for(
  "looksawful.animatedCanvasGalleryPreview.destroy",
);

function getSceneHeader(element) {
  const item = element.closest(".cv-item");

  if (!(item instanceof HTMLElement)) {
    return null;
  }

  const header = item.querySelector(
    ":scope > .cv-item__header",
  );

  return header instanceof HTMLButtonElement
    ? header
    : null;
}

function isSceneActive(element) {
  const header = getSceneHeader(element);

  return (
    !header ||
    header.getAttribute("aria-expanded") === "true"
  );
}

export function createAnimatedCanvasGalleryPreviews({
  root = document,
  sceneRuntime = null,
} = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return null;
  }

  const previews = Array.from(
    root.querySelectorAll(
      "[data-animated-canvas-gallery-preview]",
    ),
  );

  let disposed = false;

  const records = previews.map((preview) => {
    preview[PREVIEW_DESTROY]?.();

    const gallery = preview.querySelector(
      "[data-animated-canvas-gallery]",
    );

    const controlsMount = preview.querySelector(
      "[data-animated-canvas-gallery-controls]",
    );

    if (
      !(gallery instanceof HTMLElement) ||
      !(controlsMount instanceof HTMLElement)
    ) {
      return null;
    }

    applyAnimatedCanvasGalleryPreset(
      gallery,
      gallery.dataset.galleryPreset ||
        "project-showcase",
    );

    const variant =
      gallery.dataset.galleryVariant ||
      "horizontal";

    const sceneHeader =
      getSceneHeader(preview);

    const record = {
      preview,
      gallery,
      controlsMount,
      variant,
      sceneHeader,
      nearViewport: false,
      sceneActive: sceneRuntime ? false : isSceneActive(preview),
      loading: false,
      controls: null,
      visibilityObserver: null,
      unsubscribeScene: null,
    };

    const ensureControls = async () => {
      if (
        disposed ||
        record.loading ||
        record.controls ||
        !record.nearViewport ||
        !record.sceneActive
      ) {
        return;
      }

      record.loading = true;
      preview.dataset.galleryPreviewState =
        "loading";

      try {
        const definition =
          await loadAnimatedCanvasGalleryVariant(
            variant,
          );

        if (disposed) {
          return;
        }

        record.controls =
          createAnimatedCanvasGalleryControls({
            root: gallery,
            fields: definition.fields,
            variant,
          });

        controlsMount.replaceChildren(
          record.controls.element,
        );

        preview.dataset.galleryPreviewState =
          "ready";
      } catch (error) {
        preview.dataset.galleryPreviewState =
          "error";

        console.error(
          `Animated Canvas Gallery Preview: ${variant}`,
          error,
        );
      } finally {
        record.loading = false;
      }
    };

    record.visibilityObserver =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            ([entry]) => {
              record.nearViewport =
                Boolean(entry?.isIntersecting);

              void ensureControls();
            },
            {
              rootMargin: "20% 0px 20%",
              threshold: 0,
            },
          )
        : null;

    if (record.visibilityObserver) {
      record.visibilityObserver.observe(preview);
    } else {
      record.nearViewport = true;
    }

    record.unsubscribeScene = sceneRuntime?.subscribeScene?.(preview, ({ active }) => {
      record.sceneActive = active;
      void ensureControls();
    }) ?? null;

    const destroy = () => {
      record.visibilityObserver?.disconnect();
      record.unsubscribeScene?.();
      record.controls?.dispose();
      record.controls = null;
      controlsMount.replaceChildren();
      preview.dataset.galleryPreviewState =
        "disposed";

      if (preview[PREVIEW_DESTROY] === destroy) {
        delete preview[PREVIEW_DESTROY];
      }
    };

    preview[PREVIEW_DESTROY] = destroy;

    void ensureControls();

    return record;
  }).filter(Boolean);

  return () => {
    if (disposed) {
      return;
    }

    disposed = true;

    for (const record of records) {
      record.preview[PREVIEW_DESTROY]?.();
    }
  };
}
