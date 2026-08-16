const MOBILE_QUERY = "(width <= 47.999rem)";
const noop = () => {};

export function createSensetiqueStudioRows(
  scene,
  { sceneRuntime, signal } = {},
) {
  const studio = scene.querySelector(".sensetique-studio-grid-composition");
  if (!(studio instanceof HTMLElement)) return noop;

  const rows = [
    ...studio.querySelectorAll(
      ":scope > .sensetique-studio-grid-composition__row",
    ),
  ];
  const mobile = window.matchMedia?.(MOBILE_QUERY);
  let frame = 0;

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
    if (!frame) frame = requestAnimationFrame(layout);
  };

  studio.querySelectorAll("img[data-media-id]").forEach((image) => {
    if (!(image.complete && image.naturalWidth > 0)) {
      image.addEventListener("load", schedule, { passive: true, signal });
    }
  });
  studio.querySelectorAll("video[data-media-id]").forEach((video) => {
    video.addEventListener("loadedmetadata", schedule, { passive: true, signal });
  });

  const resizeObserver =
    typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
  resizeObserver?.observe(studio);
  if (!resizeObserver) {
    window.addEventListener("resize", schedule, { passive: true, signal });
  }
  mobile?.addEventListener("change", schedule, { signal });

  const unsubscribePrepare =
    sceneRuntime?.subscribePrepare?.(scene, schedule) ?? noop;
  const unsubscribeScene =
    sceneRuntime?.subscribeScene?.(scene, ({ active }) => {
      if (active) schedule();
    }) ?? noop;

  schedule();

  const destroy = () => {
    resizeObserver?.disconnect();
    unsubscribePrepare();
    unsubscribeScene();
    if (frame) cancelAnimationFrame(frame);
    clear();
  };
  destroy.refresh = schedule;
  return destroy;
}
