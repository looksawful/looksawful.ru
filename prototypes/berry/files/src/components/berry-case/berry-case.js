const TAP_MAX_DISTANCE = 10;

function isTouchLikePointer(event) {
  return event.pointerType === "touch" || event.pointerType === "pen";
}

function mediaSurfaceFromTarget(target, berryRoot) {
  if (!(target instanceof Element)) return null;

  const surface = target.closest("[data-media-caption-surface]");
  return surface instanceof HTMLElement && berryRoot.contains(surface)
    ? surface
    : null;
}

function figureForSurface(surface) {
  const figure = surface?.closest("figure[data-media-captioned]");
  return figure instanceof HTMLElement ? figure : null;
}

function closeCaption(figure) {
  if (!(figure instanceof HTMLElement)) return;
  figure.removeAttribute("data-caption-open");

  const surface = figure.querySelector(":scope > [data-media-caption-surface]");
  if (
    surface instanceof HTMLElement &&
    document.activeElement === surface
  ) {
    surface.blur();
  }
}

export function createBerryCase({ root = document } = {}) {
  const berryRoot = root.querySelector("[data-berry-case]");
  if (!(berryRoot instanceof HTMLElement)) return () => {};

  const scene = berryRoot.closest(".cv-item") ?? berryRoot;
  const figures = [
    ...berryRoot.querySelectorAll("figure[data-media-captioned]"),
  ].filter((figure) => figure instanceof HTMLElement);

  let gesture = null;

  function closeAll(except = null) {
    figures.forEach((figure) => {
      if (figure !== except) closeCaption(figure);
    });
  }

  function onPointerDown(event) {
    if (!isTouchLikePointer(event)) return;

    const surface = mediaSurfaceFromTarget(event.target, berryRoot);

    if (!(surface instanceof HTMLElement)) {
      gesture = null;
      closeAll();
      return;
    }

    gesture = {
      pointerId: event.pointerId,
      surface,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  }

  function onPointerMove(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    const distance = Math.hypot(
      event.clientX - gesture.startX,
      event.clientY - gesture.startY,
    );

    if (distance > TAP_MAX_DISTANCE) gesture.moved = true;
  }

  function onPointerUp(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;

    const { surface, moved } = gesture;
    gesture = null;

    if (moved) return;

    const figure = figureForSurface(surface);
    if (!(figure instanceof HTMLElement)) return;

    const willOpen = !figure.hasAttribute("data-caption-open");
    closeAll(willOpen ? figure : null);

    if (willOpen) {
      figure.setAttribute("data-caption-open", "");
    } else {
      closeCaption(figure);
    }
  }

  function onPointerCancel(event) {
    if (gesture?.pointerId === event.pointerId) gesture = null;
  }

  scene.addEventListener("pointerdown", onPointerDown);
  scene.addEventListener("pointermove", onPointerMove);
  scene.addEventListener("pointerup", onPointerUp);
  scene.addEventListener("pointercancel", onPointerCancel);

  return () => {
    scene.removeEventListener("pointerdown", onPointerDown);
    scene.removeEventListener("pointermove", onPointerMove);
    scene.removeEventListener("pointerup", onPointerUp);
    scene.removeEventListener("pointercancel", onPointerCancel);

    gesture = null;
    closeAll();
  };
}
