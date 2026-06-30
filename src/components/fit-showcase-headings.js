const FIT_SELECTOR = [
  "#showcase .case-chapter__header .case-chapter-heading",
  "#showcase .case-chapter__body :is(h3, h4, h5, h6, .title--lg, .interface-section__title)",
].join(", ");

const EXCLUDED_SELECTOR = [
  ".policy-book",
  "[data-policy-book]",
  ".artifact-reader",
  "[data-artifact-reader]",
  ".playlist-filter-embed",
  "[data-playlist-filter]",
  "[data-visual-demo]",
].join(", ");

const FIT_SAFE_GAP = 4;
const MIN_FONT_SIZE = 13;

function isSafeHeading(heading) {
  return heading instanceof HTMLElement && !heading.closest(EXCLUDED_SELECTOR);
}

function getTextWidth(node) {
  const range = document.createRange();

  range.selectNodeContents(node);

  const rect = range.getBoundingClientRect();
  range.detach();

  return Math.ceil(rect.width);
}

function getAvailableWidth(heading) {
  const container =
    heading.closest(".block__header, .section-head, .text-block, .content-section__text, .interface-section__copy") ||
    heading.parentElement ||
    heading;
  const rect = container.getBoundingClientRect();
  const viewportWidth = Math.max(0, window.innerWidth - FIT_SAFE_GAP * 2);
  const containerWidth = rect.width || container.clientWidth || viewportWidth;

  return Math.max(0, Math.floor(Math.min(containerWidth, viewportWidth) - FIT_SAFE_GAP));
}

function fitHeading(heading) {
  heading.style.fontSize = "";
  heading.classList.remove("is-showcase-heading-fitted");

  const availableWidth = getAvailableWidth(heading);

  if (!availableWidth) {
    return;
  }

  const baseFontSize = Number.parseFloat(window.getComputedStyle(heading).fontSize);
  const textWidth = getTextWidth(heading);

  if (!Number.isFinite(baseFontSize) || baseFontSize <= 0 || !textWidth || textWidth <= availableWidth) {
    return;
  }

  const nextFontSize = Math.max(MIN_FONT_SIZE, Math.floor(baseFontSize * (availableWidth / textWidth) * 1000) / 1000);

  heading.style.fontSize = `${nextFontSize}px`;
  heading.classList.add("is-showcase-heading-fitted");
}

export function initFitShowcaseHeadings(root = document) {
  const headings = [...root.querySelectorAll(FIT_SELECTOR)].filter(isSafeHeading);

  if (!headings.length) {
    return;
  }

  let frame = 0;

  const fitAll = () => {
    frame = 0;
    headings.forEach(fitHeading);
  };

  const scheduleFit = () => {
    if (frame) {
      return;
    }

    frame = window.requestAnimationFrame(fitAll);
  };

  scheduleFit();
  document.fonts?.ready?.then(scheduleFit).catch(() => {});
  window.addEventListener("resize", scheduleFit, { passive: true });
  window.addEventListener("orientationchange", scheduleFit, { passive: true });
}
