import {
  getAnimatedCanvasGalleryVariantMeta,
  hasAnimatedCanvasGalleryVariant,
  loadAnimatedCanvasGalleryVariant,
} from "./animated-canvas-gallery-registry.js";

import {
  applyAnimatedCanvasGalleryPreset,
} from "./animated-canvas-gallery-presets.js";

const GALLERY_DESTROY = Symbol.for(
  "looksawful.animatedCanvasGallery.destroy",
);

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item === "string") {
        return {
          src: item,
          title: "",
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const src = String(item.src ?? "").trim();

      if (!src) {
        return null;
      }

      return {
        ...item,
        src,
        title: String(item.title ?? ""),
      };
    })
    .filter(Boolean);
}

function readInlineItems(element) {
  const data = element.querySelector(
    ":scope > script[type='application/json'][data-gallery-items]",
  );

  if (data) {
    try {
      return normalizeItems(JSON.parse(data.textContent || "[]"));
    } catch (error) {
      console.error(
        "Animated Canvas Gallery: не удалось прочитать inline JSON.",
        error,
      );
    }
  }

  const template = element.querySelector(
    ":scope > template[data-gallery-items]",
  );

  if (!(template instanceof HTMLTemplateElement)) {
    return [];
  }

  return normalizeItems(
    Array.from(
      template.content.querySelectorAll(
        "img[src], [data-gallery-src]",
      ),
    ).map((item) => ({
      src:
        item.getAttribute("src") ||
        item.getAttribute("data-gallery-src") ||
        "",
      title:
        item.getAttribute("data-gallery-title") ||
        item.getAttribute("alt") ||
        "",
    })),
  );
}


function readFallbackItems(element) {
  const fallback = element.querySelector(
    ":scope > [data-gallery-fallback]",
  );

  if (!(fallback instanceof HTMLElement)) {
    return [];
  }

  return normalizeItems(
    Array.from(
      fallback.querySelectorAll(
        "img[src], [data-gallery-src]",
      ),
    ).map((item) => ({
      src:
        item.getAttribute("src") ||
        item.getAttribute("data-gallery-src") ||
        "",
      title:
        item.getAttribute("data-gallery-title") ||
        item.getAttribute("alt") ||
        "",
    })),
  );
}

function resolveItems(element, sources) {
  const inlineItems = readInlineItems(element);

  if (inlineItems.length) {
    return inlineItems;
  }

  const fallbackItems = readFallbackItems(element);

  if (fallbackItems.length) {
    return fallbackItems;
  }

  const sourceName = element.dataset.gallerySource || "";

  return normalizeItems(sources?.[sourceName] ?? []);
}

function getAccordionHeader(element) {
  const item = element.closest(".cv-item");

  if (!(item instanceof HTMLElement)) {
    return null;
  }

  const header = item.querySelector(":scope > .cv-item__header");

  return header instanceof HTMLButtonElement ? header : null;
}

function isAccordionActive(element) {
  const header = getAccordionHeader(element);

  if (!header) {
    return true;
  }

  return header.getAttribute("aria-expanded") === "true";
}

function createActivityController(element, component) {
  let visible = false;
  let disposed = false;

  const accordionHeader = getAccordionHeader(element);

  const sync = () => {
    if (disposed) {
      return;
    }

    const active =
      visible &&
      !document.hidden &&
      isAccordionActive(element);

    if (active) {
      component.resume?.();
    } else {
      component.suspend?.();
    }

    element.dataset.galleryActive = String(active);
  };

  const visibilityObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          ([entry]) => {
            visible = Boolean(entry?.isIntersecting);
            sync();
          },
          {
            rootMargin: "20% 0px 20%",
            threshold: 0.01,
          },
        )
      : null;

  const accordionObserver =
    accordionHeader && typeof MutationObserver === "function"
      ? new MutationObserver(sync)
      : null;

  visibilityObserver?.observe(element);

  if (!visibilityObserver) {
    visible = true;
  }

  accordionObserver?.observe(accordionHeader, {
    attributes: true,
    attributeFilter: ["aria-expanded"],
  });

  document.addEventListener("visibilitychange", sync);

  sync();

  return () => {
    if (disposed) {
      return;
    }

    disposed = true;
    visibilityObserver?.disconnect();
    accordionObserver?.disconnect();
    document.removeEventListener("visibilitychange", sync);
  };
}

export async function mountAnimatedCanvasGallery(
  element,
  {
    sources = {},
  } = {},
) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  element[GALLERY_DESTROY]?.();

  const variant = element.dataset.galleryVariant || "horizontal";

  if (!hasAnimatedCanvasGalleryVariant(variant)) {
    element.dataset.galleryState = "error";
    console.error(
      `Animated Canvas Gallery: вариант "${variant}" не существует.`,
    );
    return null;
  }

  const canvas = element.querySelector(
    ":scope > canvas[data-animated-canvas-gallery-canvas], :scope > canvas[data-moves-canvas]",
  );

  if (!(canvas instanceof HTMLCanvasElement)) {
    element.dataset.galleryState = "error";
    console.error(
      "Animated Canvas Gallery: внутри компонента не найден Canvas.",
    );
    return null;
  }

  const items = resolveItems(element, sources);

  if (!items.length) {
    element.dataset.galleryState = "empty";
    return null;
  }

  applyAnimatedCanvasGalleryPreset(
    element,
    element.dataset.galleryPreset || "embedded",
  );

  const variantMeta =
    getAnimatedCanvasGalleryVariantMeta(variant);

  element.dataset.galleryState = "loading";
  element.style.setProperty(
    "--animated-canvas-gallery-aspect-ratio",
    variantMeta?.aspectRatio || "16 / 9",
  );

  let component = null;
  let destroyActivity = null;
  let disposed = false;

  try {
    const definition =
      await loadAnimatedCanvasGalleryVariant(variant);

    if (disposed) {
      return null;
    }

    element.style.setProperty(
      "--animated-canvas-gallery-aspect-ratio",
      definition.aspectRatio,
    );

    component = await definition.mount(element, {
      items,
    });

    if (disposed) {
      component?.dispose?.();
      return null;
    }

    destroyActivity = createActivityController(
      element,
      component,
    );

    element.dataset.galleryState = "ready";
  } catch (error) {
    element.dataset.galleryState = "error";
    console.error(
      `Animated Canvas Gallery: не удалось подключить "${variant}".`,
      error,
    );
  }

  const destroy = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    destroyActivity?.();
    destroyActivity = null;
    component?.dispose?.();
    component = null;

    element.removeAttribute("data-gallery-active");
    element.dataset.galleryState = "disposed";

    if (element[GALLERY_DESTROY] === destroy) {
      delete element[GALLERY_DESTROY];
    }
  };

  element[GALLERY_DESTROY] = destroy;

  return destroy;
}

export function createAnimatedCanvasGalleries({
  root = document,
  sources = {},
} = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return null;
  }

  const elements = Array.from(
    root.querySelectorAll("[data-animated-canvas-gallery]"),
  );

  let disposed = false;

  const records = elements.map((element) => {
    const accordionHeader = getAccordionHeader(element);

    const record = {
      element,
      accordionHeader,
      nearViewport: false,
      mounting: false,
      cleanup: null,
      visibilityObserver: null,
      accordionObserver: null,
    };

    const tryMount = async () => {
      if (
        disposed ||
        record.mounting ||
        record.cleanup ||
        !record.nearViewport ||
        !isAccordionActive(element)
      ) {
        return;
      }

      record.mounting = true;

      try {
        const cleanup = await mountAnimatedCanvasGallery(
          element,
          {
            sources,
          },
        );

        if (disposed) {
          cleanup?.();
          return;
        }

        if (typeof cleanup === "function") {
          record.cleanup = cleanup;
        }
      } finally {
        record.mounting = false;
      }
    };

    record.visibilityObserver =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            ([entry]) => {
              record.nearViewport =
                Boolean(entry?.isIntersecting);

              void tryMount();
            },
            {
              rootMargin: "60% 0px 60%",
              threshold: 0,
            },
          )
        : null;

    if (record.visibilityObserver) {
      record.visibilityObserver.observe(element);
    } else {
      record.nearViewport = true;
    }

    record.accordionObserver =
      accordionHeader &&
      typeof MutationObserver === "function"
        ? new MutationObserver(() => {
            void tryMount();
          })
        : null;

    record.accordionObserver?.observe(
      accordionHeader,
      {
        attributes: true,
        attributeFilter: ["aria-expanded"],
      },
    );

    void tryMount();

    return record;
  });

  return () => {
    if (disposed) {
      return;
    }

    disposed = true;

    for (const record of records) {
      record.visibilityObserver?.disconnect();
      record.accordionObserver?.disconnect();
      record.cleanup?.();
      record.cleanup = null;
    }
  };
}
