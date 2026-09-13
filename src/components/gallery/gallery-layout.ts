type Destroy = () => void;

function resizeCard(card: HTMLElement): void {
  const grid = card.closest<HTMLElement>("[data-gallery-series-grid]");
  const image = card.querySelector<HTMLImageElement>("img");
  if (!grid || !image) return;

  const styles = getComputedStyle(grid);
  const rowHeight = Number.parseFloat(styles.gridAutoRows) || 4;
  const rowGap = Number.parseFloat(styles.rowGap) || 0;
  const width = card.getBoundingClientRect().width;
  const intrinsicWidth = image.naturalWidth || Number(image.getAttribute("width")) || 0;
  const intrinsicHeight = image.naturalHeight || Number(image.getAttribute("height")) || 0;
  if (width <= 0 || intrinsicWidth <= 0 || intrinsicHeight <= 0) return;

  const height = width * intrinsicHeight / intrinsicWidth;
  const span = Math.max(1, Math.ceil((height + rowGap) / (rowHeight + rowGap)));
  card.style.setProperty("--gallery-row-span", String(span));
}

function resizeAll(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("[data-gallery-card]").forEach(resizeCard);
}

export function createGalleryLayout(root: HTMLElement): Destroy {
  let frame = 0;

  const schedule = (): void => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      resizeAll(root);
    });
  };

  root.setAttribute("data-gallery-layout-ready", "");
  root.querySelectorAll<HTMLImageElement>("[data-gallery-card] img").forEach((image) => {
    if (!image.complete) image.addEventListener("load", schedule, { once: true });
  });

  const observer = typeof ResizeObserver === "function"
    ? new ResizeObserver(schedule)
    : null;
  observer?.observe(root);
  window.addEventListener("resize", schedule, { passive: true });
  schedule();

  return () => {
    if (frame) cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener("resize", schedule);
    root.removeAttribute("data-gallery-layout-ready");
    root.querySelectorAll<HTMLElement>("[data-gallery-card]").forEach((card) => {
      card.style.removeProperty("--gallery-row-span");
    });
  };
}
