const mountedChapters = new WeakSet();
const mountedJesteiFrames = new WeakSet();
const mountedJesteiRails = new WeakSet();

function syncChapter(chapter) {
  const isOpen = chapter.classList.contains("is-open");
  const toggle = chapter.querySelector("[data-case-chapter-toggle]");

  chapter.classList.toggle("is-compact", !isOpen);

  if (!toggle) {
    return;
  }

  const openLabel = toggle.getAttribute("data-open-label") || "раскрыть детали";
  const closeLabel = toggle.getAttribute("data-close-label") || "свернуть детали";

  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.textContent = isOpen ? closeLabel : openLabel;
}

function preserveScroll(target, callback) {
  const before = target.getBoundingClientRect().top;
  callback();
  const after = target.getBoundingClientRect().top;
  window.scrollBy(0, after - before);
}

function getFrameParts(frame) {
  return {
    wrap: frame.querySelector(".jestei-chapter-frame__body-wrap"),
    body: frame.querySelector(".jestei-chapter-frame__body"),
    toggle: frame.querySelector("[data-jestei-chapter-toggle]")
  };
}

function getFrameHeight(body) {
  if (!(body instanceof HTMLElement)) {
    return 0;
  }

  return body.offsetHeight;
}

function animateHeight(element, from, to, options) {
  const gsap = window.gsap;

  if (gsap) {
    gsap.killTweensOf(element);
    gsap.fromTo(
      element,
      { height: from },
      {
        height: to,
        duration: options.duration,
        ease: options.ease,
        onComplete: options.onComplete
      }
    );
    return;
  }

  element.style.height = String(to) + "px";
  window.setTimeout(options.onComplete, options.duration * 1000);
}

function syncJesteiFrame(frame) {
  const parts = getFrameParts(frame);
  const isExpanded = frame.dataset.expanded === "true";

  if (parts.toggle instanceof HTMLButtonElement) {
    parts.toggle.setAttribute("aria-expanded", String(isExpanded));
    parts.toggle.textContent = isExpanded ? "свернуть" : "развернуть";
  }

  frame.classList.toggle("is-open", isExpanded);
}

function expandJesteiFrame(frame) {
  if (frame.dataset.expanded === "true" || frame.dataset.animating === "true") {
    return;
  }

  const parts = getFrameParts(frame);

  if (!(parts.wrap instanceof HTMLElement) || !(parts.body instanceof HTMLElement)) {
    return;
  }

  frame.dataset.expanded = "true";
  frame.dataset.animating = "true";
  syncJesteiFrame(frame);
  parts.wrap.setAttribute("aria-hidden", "false");

  const targetHeight = getFrameHeight(parts.body);

  animateHeight(parts.wrap, 0, targetHeight, {
    duration: 0.7,
    ease: "power3.inOut",
    onComplete: () => {
      parts.wrap.style.height = "auto";
      frame.dataset.animating = "false";
    }
  });
}

function collapseJesteiFrame(frame) {
  if (frame.dataset.expanded !== "true" || frame.dataset.animating === "true") {
    return;
  }

  const parts = getFrameParts(frame);

  if (!(parts.wrap instanceof HTMLElement)) {
    return;
  }

  frame.dataset.expanded = "false";
  frame.dataset.animating = "true";
  syncJesteiFrame(frame);

  const currentHeight = parts.wrap.offsetHeight;

  animateHeight(parts.wrap, currentHeight, 0, {
    duration: 0.6,
    ease: "power3.inOut",
    onComplete: () => {
      parts.wrap.setAttribute("aria-hidden", "true");
      frame.dataset.animating = "false";
    }
  });
}

function toggleJesteiFrame(frame) {
  if (frame.dataset.expanded === "true") {
    collapseJesteiFrame(frame);
    return;
  }

  expandJesteiFrame(frame);
}

function initJesteiChapterFrames(root) {
  const frames = Array.from(root.querySelectorAll("[data-jestei-chapter-frame]"));

  if (frames.length === 0) {
    return;
  }

  for (const frame of frames) {
    if (!(frame instanceof HTMLElement) || mountedJesteiFrames.has(frame)) {
      continue;
    }

    mountedJesteiFrames.add(frame);
    frame.dataset.expanded = "false";
    frame.dataset.animating = "false";
    syncJesteiFrame(frame);

    const parts = getFrameParts(frame);

    if (parts.toggle instanceof HTMLButtonElement) {
      parts.toggle.addEventListener("click", () => {
        toggleJesteiFrame(frame);
      });
    }
  }
}


function getRailParts(rail) {
  return {
    viewport: rail.querySelector("[data-jestei-action-rail-viewport]"),
    prev: rail.querySelector("[data-jestei-action-rail-prev]"),
    next: rail.querySelector("[data-jestei-action-rail-next]")
  };
}

function getRailMaxScroll(viewport) {
  return Math.max(0, viewport.scrollWidth - viewport.clientWidth);
}

function updateRailControls(rail, viewport, prev, next) {
  const maxScroll = getRailMaxScroll(viewport);
  const currentScroll = viewport.scrollLeft;

  prev.hidden = currentScroll <= 1;
  next.hidden = currentScroll >= maxScroll - 1;
  rail.dataset.railReady = "true";
}

function initJesteiActionRail(rail) {
  if (!(rail instanceof HTMLElement) || mountedJesteiRails.has(rail)) {
    return;
  }

  const { viewport, prev, next } = getRailParts(rail);

  if (!(viewport instanceof HTMLElement) || !(prev instanceof HTMLButtonElement) || !(next instanceof HTMLButtonElement)) {
    return;
  }

  mountedJesteiRails.add(rail);
  rail.dataset.railReady = "false";
  prev.hidden = true;

  let dragState = null;

  const update = () => {
    updateRailControls(rail, viewport, prev, next);
  };

  const scrollByPage = (direction) => {
    viewport.scrollBy({
      left: direction * Math.max(240, viewport.clientWidth * 0.82),
      behavior: "smooth"
    });
  };

  const stopDragging = (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    viewport.classList.remove("is-dragging");

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    dragState = null;
    update();
  };

  prev.addEventListener("click", () => scrollByPage(-1));
  next.addEventListener("click", () => scrollByPage(1));

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: viewport.scrollLeft
    };

    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    viewport.scrollLeft = dragState.startScrollLeft - (event.clientX - dragState.startX);
    update();
  });

  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);
  viewport.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  requestAnimationFrame(update);
}

function initJesteiActionRails(root) {
  root.querySelectorAll("[data-jestei-action-rail]").forEach(initJesteiActionRail);
}


export function initCaseChapters(root = document) {
  root.querySelectorAll("[data-case-chapter]").forEach((chapter) => {
    if (!(chapter instanceof HTMLElement) || mountedChapters.has(chapter)) {
      return;
    }

    mountedChapters.add(chapter);
    syncChapter(chapter);

    const toggle = chapter.querySelector("[data-case-chapter-toggle]");

    if (!(toggle instanceof HTMLButtonElement)) {
      return;
    }

    toggle.addEventListener("click", () => {
      preserveScroll(chapter, () => {
        const nextOpen = !chapter.classList.contains("is-open");
        chapter.classList.toggle("is-open", nextOpen);
        chapter.classList.toggle("is-compact", !nextOpen);
        syncChapter(chapter);
      });
    });
  });

  initJesteiChapterFrames(root);
  initJesteiActionRails(root);
}