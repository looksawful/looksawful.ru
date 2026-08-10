import "./image-skeletons.css";

const IMAGE_SELECTOR = ".cv-item img";
const SURFACE_SELECTOR = [
  "[data-media-caption-surface]",
  "[data-media-gallery-item]",
  "[data-media-marquee-surface]",
  ".category-card__media",
].join(",");
const SKELETON_DELAY = 140;

function imageSurface(image) {
  return image.closest(SURFACE_SELECTOR);
}

function trackedImage(image, surface) {
  const slider = image.closest("[data-media-slider]");

  if (!(slider instanceof HTMLElement) || !surface.contains(slider)) {
    return image;
  }

  return slider.querySelector(":scope > img") ?? image;
}

function imageReady(image) {
  return image.complete && image.naturalWidth > 0;
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

    const image = trackedImage(candidate, surface);
    surfaces.add(surface);

    if (imageReady(image)) return;

    let timer = window.setTimeout(() => {
      if (!imageReady(image)) surface.dataset.imageSkeleton = "";
    }, SKELETON_DELAY);

    const ready = () => {
      window.clearTimeout(timer);
      timer = 0;
      surface.removeAttribute("data-image-skeleton");
    };

    const failed = () => {
      window.clearTimeout(timer);
      timer = 0;
      surface.dataset.imageSkeleton = "";
    };

    image.addEventListener("load", ready, { once: true });
    image.addEventListener("error", failed, { once: true });

    cleanups.push(() => {
      if (timer) window.clearTimeout(timer);
      image.removeEventListener("load", ready);
      image.removeEventListener("error", failed);
      surface.removeAttribute("data-image-skeleton");
    });
  });

  return () => {
    while (cleanups.length) cleanups.pop()?.();
  };
}
