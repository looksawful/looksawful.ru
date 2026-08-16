const MOBILE_QUERY = "(width <= 47.999rem)";
const noop = () => {};

export function createSensetiqueStudioRows(scene, { signal } = {}) {
  const studio = scene.querySelector(".sensetique-studio-grid-composition");
  if (!(studio instanceof HTMLElement)) return noop;

  const rows = [
    ...studio.querySelectorAll(
      ":scope > .sensetique-studio-grid-composition__row",
    ),
  ];
  const mobile = window.matchMedia?.(MOBILE_QUERY);
  let frame = 0;
  let prepared = false;
  let resizeObserver = null;
  let prepareObserver = null;

  const ratioFor = (item) => {
    const media = item.querySelector("img[data-media-id], video[data-media-id]");
    if (media instanceof HTMLImageElement) {
      const width = media.naturalWidth || Number(media.getAttribute("width"));
      const height = media.naturalHeight || Number(media.getAttribute("height"));
      return width > 0 && height > 0 ? width / height : 1;
    }
    if (media instanceof HTMLVideoElement) {
      const width = media.videoWidth || Number(media.getAttribute("width"));
      const height = media.videoHeight || Number(media.getAttribute("height"));
      return width > 0 && height > 0 ? width / height : 1;
    }
    return 1;
  };

  const clear = () => {
    rows.forEach((row) => {
      row.style.removeProperty("--studio-row-height");
      row
        .querySelectorAll(":scope > .sensetique-studio-grid-composition__item")
        .forEach((item) => item.style.removeProperty("--studio-item-width"));
    });
  };

  const layout = () => {
    frame = 0;
    if (!prepared) return;
    if (mobile?.matches) {
      clear();
      return;
    }

    rows.forEach((row) => {
      const items = [
        ...row.querySelectorAll(
          ":scope > .sensetique-studio-grid-composition__item:not([hidden])",
        ),
      ];
      if (!items.length) return;

      const style = getComputedStyle(row);
      const gap = Number.parseFloat(style.columnGap || style.gap) || 0;
      const available = row.clientWidth - gap * Math.max(0, items.length - 1);
      if (available <= 0) return;

      const ratios = items.map(ratioFor);
      const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0) || 1;
      const height = available / ratioSum;

      row.style.setProperty("--studio-row-height", `${height}px`);
      items.forEach((item, index) => {
        item.style.setProperty("--studio-item-width", `${height * ratios[index]}px`);
      });
    });
  };

  const schedule = () => {
    if (prepared && !frame) frame = requestAnimationFrame(layout);
  };

  const prepare = () => {
    if (prepared) return;
    prepared = true;
    prepareObserver?.disconnect();
    prepareObserver = null;

    studio.querySelectorAll("img[data-media-id]").forEach((image) => {
      if (!(image.complete && image.naturalWidth > 0)) {
        image.addEventListener("load", schedule, { passive: true, signal });
      }
    });
    studio.querySelectorAll("video[data-media-id]").forEach((video) => {
      video.addEventListener("loadedmetadata", schedule, { passive: true, signal });
    });

    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(studio);
    } else {
      window.addEventListener("resize", schedule, { passive: true, signal });
    }
    mobile?.addEventListener("change", schedule, { signal });
    schedule();
  };

  if (typeof IntersectionObserver === "function") {
    prepareObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) prepare();
      },
      { rootMargin: "50% 0px", threshold: 0.01 },
    );
    prepareObserver.observe(studio);
  } else {
    prepare();
  }

  const destroy = () => {
    prepareObserver?.disconnect();
    resizeObserver?.disconnect();
    if (frame) cancelAnimationFrame(frame);
    clear();
  };
  destroy.refresh = () => {
    if (prepared) schedule();
  };
  return destroy;
}
