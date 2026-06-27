const mountedJesteiRails = new WeakSet();

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

export function initCaseChapters(root = document) {
  root.querySelectorAll("[data-jestei-action-rail]").forEach(initJesteiActionRail);
}
