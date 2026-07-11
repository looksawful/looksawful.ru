const CARD_SELECTOR = "#jestei-results .jestei-bento__card--manual";
const CONTENT_SELECTOR = ".jestei-bento__content";
const VISUAL_SELECTOR = ".jestei-bento__process-visual";
const SVG_SELECTOR = ".jestei-bento__process-svg";
const SVG_ASPECT = 848 / 550;

function number(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mountCard(card) {
  if (!(card instanceof HTMLElement) || card.dataset.processLayoutMounted === "true") {
    return () => {};
  }

  const content = card.querySelector(CONTENT_SELECTOR);
  const visual = card.querySelector(VISUAL_SELECTOR);
  const svg = card.querySelector(SVG_SELECTOR);
  if (!(content instanceof HTMLElement) || !(visual instanceof HTMLElement) || !(svg instanceof SVGElement)) {
    return () => {};
  }

  const win = card.ownerDocument.defaultView || window;
  const desktopQuery = win.matchMedia("(min-width: 72.001rem)");
  let resizeObserver;
  let frame = 0;
  let currentMode = "";

  card.dataset.processLayoutMounted = "true";

  function applyMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;
    card.classList.toggle("is-manual-stack", mode === "stack");
    card.classList.toggle("is-manual-side", mode === "side");
    card.dataset.manualLayout = mode;
  }

  function update() {
    frame = 0;

    if (!desktopQuery.matches) {
      applyMode("stack");
      return;
    }

    const cardStyle = win.getComputedStyle(card);
    const paddingInline = number(cardStyle.paddingLeft) + number(cardStyle.paddingRight);
    const paddingBlock = number(cardStyle.paddingTop) + number(cardStyle.paddingBottom);
    const gap = Math.max(number(cardStyle.rowGap), number(cardStyle.gap), 12);
    const innerWidth = Math.max(0, card.clientWidth - paddingInline);
    const innerHeight = Math.max(0, card.clientHeight - paddingBlock);
    const contentHeight = Math.ceil(content.getBoundingClientRect().height);
    const availableStackHeight = Math.max(0, innerHeight - contentHeight - gap);
    const requiredStackHeight = innerWidth / SVG_ASPECT;

    const threshold = currentMode === "side" ? 1.08 : 0.96;
    const canStack =
      availableStackHeight >= 220 &&
      availableStackHeight >= requiredStackHeight * threshold;

    applyMode(canStack ? "stack" : "side");
  }

  function scheduleUpdate() {
    if (frame) return;
    frame = win.requestAnimationFrame(update);
  }

  if ("ResizeObserver" in win) {
    resizeObserver = new win.ResizeObserver(scheduleUpdate);
    resizeObserver.observe(card);
    resizeObserver.observe(content);
  } else {
    win.addEventListener("resize", scheduleUpdate, { passive: true });
  }

  desktopQuery.addEventListener?.("change", scheduleUpdate);
  scheduleUpdate();

  return () => {
    if (frame) win.cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    win.removeEventListener("resize", scheduleUpdate);
    desktopQuery.removeEventListener?.("change", scheduleUpdate);
    card.classList.remove("is-manual-stack", "is-manual-side");
    delete card.dataset.manualLayout;
    delete card.dataset.processLayoutMounted;
  };
}

export function mountJesteiProcessLayout(root = document) {
  const disposers = [...root.querySelectorAll(CARD_SELECTOR)].map((card) => mountCard(card));
  return () => disposers.forEach((dispose) => dispose?.());
}
