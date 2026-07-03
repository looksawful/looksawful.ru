const FIT_SELECTOR = [
  "[data-showcase] [data-cover-title]",
  "[data-showcase] [data-section-title]",
  "[data-showcase] [data-content-title]",
].join(", ");

const MIN_SCALE = 0.56;
const RESIZE_DEBOUNCE = 160;

export function round3FitAllowed(element) {
  return Boolean(element?.matches?.(FIT_SELECTOR));
}

function measureTextWidth(element) {
  if (!(element instanceof Element)) return 0;
  const range = document.createRange();
  range.selectNodeContents(element);
  const rect = range.getBoundingClientRect();
  range.detach?.();
  return rect.width;
}

function fitHeading(element) {
  if (!round3FitAllowed(element)) return;
  element.style.removeProperty("font-size");
  element.removeAttribute("data-fit-showcase-heading");

  const box = element.getBoundingClientRect();
  if (!box.width) return;

  const textWidth = measureTextWidth(element);
  if (!textWidth || textWidth <= box.width * 1.015) return;

  const computed = window.getComputedStyle(element);
  const fontSize = Number.parseFloat(computed.fontSize);
  if (!Number.isFinite(fontSize) || fontSize <= 0) return;

  const ratio = Math.max(MIN_SCALE, Math.min(1, box.width / textWidth));
  element.style.fontSize = `${Math.floor(fontSize * ratio * 100) / 100}px`;
  element.dataset.fitShowcaseHeading = "round3";
}

export function initFitShowcaseHeadings(root = document) {
  const scope = root instanceof Element || root instanceof Document ? root : document;
  const headings = [...scope.querySelectorAll(FIT_SELECTOR)].filter(round3FitAllowed);
  if (!headings.length) return null;

  let timer = 0;
  const fitAll = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      headings.forEach(fitHeading);
    }, RESIZE_DEBOUNCE);
  };

  window.requestAnimationFrame(() => headings.forEach(fitHeading));
  window.addEventListener("resize", fitAll, { passive: true });
  document.fonts?.ready?.then?.(() => headings.forEach(fitHeading)).catch?.(() => {});

  return {
    destroy() {
      window.clearTimeout(timer);
      window.removeEventListener("resize", fitAll);
      headings.forEach((heading) => {
        heading.style.removeProperty("font-size");
        heading.removeAttribute("data-fit-showcase-heading");
      });
    },
  };
}
