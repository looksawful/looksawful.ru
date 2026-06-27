const mountedChapterFrames = new WeakSet();
const mountedJesteiRails = new WeakSet();

function getFrameParts(frame) {
  return {
    wrap: frame.querySelector(".jestei-chapter-frame__body-wrap, .case-chapter-frame__body-wrap"),
    body: frame.querySelector(".jestei-chapter-frame__body, .case-chapter-frame__body"),
    toggle: frame.querySelector("[data-jestei-chapter-toggle], [data-case-chapter-toggle]")
  };
}

function getFrameHeight(body) {
  return body instanceof HTMLElement ? body.offsetHeight : 0;
}

function animateHeight(element, from, to, options) {
  const gsap = window.gsap;

  if (!gsap) {
    element.style.height = String(to) + "px";
    window.setTimeout(options.onComplete, options.duration * 1000);
    return;
  }

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
}

function syncChapterFrame(frame) {
  const { toggle } = getFrameParts(frame);
  const isExpanded = frame.dataset.expanded === "true";

  frame.classList.toggle("is-open", isExpanded);

  if (toggle instanceof HTMLButtonElement) {
    toggle.setAttribute("aria-expanded", String(isExpanded));
    toggle.textContent = isExpanded ? "свернуть" : "развернуть";
  }
}

function setChapterFrameExpanded(frame, nextExpanded) {
  if (frame.dataset.animating === "true" || frame.dataset.expanded === String(nextExpanded)) {
    return;
  }

  const { wrap, body } = getFrameParts(frame);

  if (!(wrap instanceof HTMLElement) || !(body instanceof HTMLElement)) {
    return;
  }

  const from = nextExpanded ? 0 : wrap.offsetHeight;
  const to = nextExpanded ? getFrameHeight(body) : 0;

  frame.dataset.expanded = String(nextExpanded);
  frame.dataset.animating = "true";
  syncChapterFrame(frame);

  if (nextExpanded) {
    wrap.setAttribute("aria-hidden", "false");
  }

  animateHeight(wrap, from, to, {
    duration: nextExpanded ? 0.7 : 0.6,
    ease: "power3.inOut",
    onComplete: () => {
      wrap.style.height = nextExpanded ? "auto" : "0px";
      wrap.setAttribute("aria-hidden", String(!nextExpanded));
      frame.dataset.animating = "false";
    }
  });
}

function initChapterFrames(root) {
  root.querySelectorAll("[data-jestei-chapter-frame], [data-case-chapter-frame]").forEach((frame) => {
    if (!(frame instanceof HTMLElement) || mountedChapterFrames.has(frame)) {
      return;
    }

    mountedChapterFrames.add(frame);

    if (frame.dataset.stage01Unpacked === "true") {
      frame.dataset.expanded = "true";
      frame.dataset.animating = "false";
      frame.classList.add("is-open");
      return;
    }

    frame.dataset.expanded = "false";
    frame.dataset.animating = "false";
    syncChapterFrame(frame);

    const { toggle } = getFrameParts(frame);

    if (toggle instanceof HTMLButtonElement) {
      toggle.addEventListener("click", () => {
        setChapterFrameExpanded(frame, frame.dataset.expanded !== "true");
      });
    }
  });
}

function getRailParts(rail) {
  return {
    viewport: rail.querySelector("[data-jestei-action-rail-viewport]"),
    prev: rail.querySelector("[data-jestei-action-rail-prev]"),
    next: rail.querySelector("[data-jestei-action-rail-next]")
  };
}

function updateRailControls(rail, viewport, prev, next) {
  const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
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
  const update = () => updateRailControls(rail, viewport, prev, next);

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
  initChapterFrames(root);
  initJesteiActionRails(root);
}