import "./image-skeletons.css";

const IMAGE_SELECTOR = ".cv-item img";
const SURFACE_SELECTOR = [
  "[data-media-caption-surface]",
  "[data-media-gallery-item]",
  "[data-media-marquee-surface]",
  ".category-card__media",
].join(",");
const SKELETON_DELAY = 140;
const SKELETON_VISIBILITY_MARGIN = "320px 0px";

function imageSurface(image) {
  return image.closest(SURFACE_SELECTOR);
}

function relevantSlider(image, surface) {
  const slider = image.closest("[data-media-slider]");

  if (!(slider instanceof HTMLElement) || !surface.contains(slider)) {
    return null;
  }

  return slider;
}

function trackedImage(image, surface) {
  const slider = relevantSlider(image, surface);

  if (!(slider instanceof HTMLElement)) {
    return image;
  }

  return (
    slider.querySelector(":scope > img[data-active]") ||
    slider.querySelector(":scope > img") ||
    image
  );
}

function imageReady(image) {
  return image.complete && image.naturalWidth > 0;
}

function surfaceReady(image, surface) {
  return imageReady(trackedImage(image, surface));
}

export function createImageSkeletons({ root = document } = {}) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return () => {};
  }

  const surfaces = new Set();
  const cleanups = [];

  root.querySelectorAll(IMAGE_SELECTOR).forEach((candidate) => {
    if (!(candidate instanceof HTMLImageElement)) return;

    const surface = imageSurface(candidate);
    if (!(surface instanceof HTMLElement) || surfaces.has(surface)) return;

    const image = candidate;
    const slider = relevantSlider(image, surface);
    surfaces.add(surface);

    if (!(slider instanceof HTMLElement) && imageReady(image)) return;

    const trackedImages = new Set(
      slider instanceof HTMLElement
        ? slider.querySelectorAll(":scope > img")
        : [image],
    );

    let nearViewport = !("IntersectionObserver" in window);
    let timer = 0;
    let visibilityObserver = null;

    const clearTimer = () => {
      if (!timer) return;
      window.clearTimeout(timer);
      timer = 0;
    };

    const hideSkeleton = () => {
      clearTimer();
      surface.removeAttribute("data-image-skeleton");
    };

    const showSkeletonSoon = () => {
      clearTimer();

      timer = window.setTimeout(() => {
        timer = 0;
        if (nearViewport && !surfaceReady(image, surface)) {
          surface.dataset.imageSkeleton = "";
        }
      }, SKELETON_DELAY);
    };

    const sync = () => {
      if (surfaceReady(image, surface) || !nearViewport) {
        hideSkeleton();
        return;
      }

      showSkeletonSoon();
    };

    const ready = () => {
      sync();
    };

    const failed = () => {
      if (nearViewport && !surfaceReady(image, surface)) {
        clearTimer();
        surface.dataset.imageSkeleton = "";
      }
    };

    for (const tracked of trackedImages) {
      tracked.addEventListener("load", ready);
      tracked.addEventListener("error", failed);
    }

    surface.addEventListener("media-slider:change", sync);

    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          nearViewport = Boolean(entry?.isIntersecting);
          sync();
        },
        {
          rootMargin: SKELETON_VISIBILITY_MARGIN,
          threshold: 0,
        },
      );
      visibilityObserver.observe(surface);
    }

    requestAnimationFrame(sync);

    cleanups.push(() => {
      hideSkeleton();
      visibilityObserver?.disconnect();
      surface.removeEventListener("media-slider:change", sync);

      for (const tracked of trackedImages) {
        tracked.removeEventListener("load", ready);
        tracked.removeEventListener("error", failed);
      }
    });
  });

  return () => {
    while (cleanups.length) cleanups.pop()?.();
  };
}
