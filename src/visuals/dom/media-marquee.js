const MARQUEE_SELECTOR = "[data-media-marquee]";
const TRACK_SELECTOR = "[data-media-marquee-track]";
const CLONE_ATTRIBUTE = "data-media-marquee-clone";
const READY_ATTRIBUTE = "data-media-marquee-ready";

function getSpeed(root) {
  const value = Number(root.dataset.mediaMarqueeSpeed);

  if (!Number.isFinite(value) || value <= 0) {
    return 18;
  }

  return value;
}

function createClone(item) {
  const clone = item.cloneNode(true);

  clone.setAttribute(CLONE_ATTRIBUTE, "true");
  clone.setAttribute("aria-hidden", "true");

  if (clone.matches("a, button")) {
    clone.setAttribute("tabindex", "-1");
  }

  clone.querySelectorAll("a, button").forEach((element) => {
    element.setAttribute("tabindex", "-1");
  });

  clone.querySelectorAll("[id]").forEach((element) => {
    element.removeAttribute("id");
  });

  return clone;
}

function initMediaMarquee(root) {
  if (root.dataset.mediaMarqueeReady === "true") {
    return;
  }

  const track = root.querySelector(TRACK_SELECTOR);

  if (!track) {
    return;
  }

  const originalItems = Array.from(track.children);

  if (!originalItems.length) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reduceMotion.matches) {
    return;
  }

  root.dataset.mediaMarqueeReady = "true";

  let frameId = 0;
  let lastTime = 0;
  let offsetX = 0;
  let loopWidth = 0;
  let isPaused = false;

  const speed = getSpeed(root);

  function removeClones() {
    track.querySelectorAll("[" + CLONE_ATTRIBUTE + "]").forEach((clone) => {
      clone.remove();
    });
  }

  function appendCloneGroup() {
    originalItems.forEach((item) => {
      track.appendChild(createClone(item));
    });
  }

  function measureLoopWidth() {
    const firstOriginal = originalItems[0];
    const firstClone = track.querySelector("[" + CLONE_ATTRIBUTE + "]");

    if (!firstOriginal || !firstClone) {
      return 0;
    }

    return firstClone.offsetLeft - firstOriginal.offsetLeft;
  }

  function setup() {
    cancelAnimationFrame(frameId);

    removeClones();
    appendCloneGroup();

    loopWidth = measureLoopWidth();

    if (loopWidth <= 0) {
      return;
    }

    let safety = 0;
    const minTrackWidth = root.offsetWidth + loopWidth * 2;

    while (track.scrollWidth < minTrackWidth && safety < 20) {
      appendCloneGroup();
      safety += 1;
    }

    offsetX = 0;
    lastTime = performance.now();
    track.style.transform = "translate3d(0, 0, 0)";

    frameId = requestAnimationFrame(update);
  }

  function update(currentTime) {
    const delta = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    if (!isPaused && loopWidth > 0) {
      offsetX -= speed * delta;

      while (offsetX <= -loopWidth) {
        offsetX += loopWidth;
      }

      track.style.transform = "translate3d(" + offsetX + "px, 0, 0)";
    }

    frameId = requestAnimationFrame(update);
  }

  root.addEventListener("mouseenter", () => {
    isPaused = true;
  });

  root.addEventListener("mouseleave", () => {
    isPaused = false;
  });

  root.addEventListener("focusin", () => {
    isPaused = true;
  });

  root.addEventListener("focusout", () => {
    isPaused = false;
  });

  const resizeObserver = new ResizeObserver(() => {
    setup();
  });

  resizeObserver.observe(root);

  window.addEventListener("load", setup, { once: true });

  setup();
}

export function initMediaMarquees(scope = document) {
  scope.querySelectorAll(MARQUEE_SELECTOR).forEach(initMediaMarquee);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initMediaMarquees();
  });
} else {
  initMediaMarquees();
}

