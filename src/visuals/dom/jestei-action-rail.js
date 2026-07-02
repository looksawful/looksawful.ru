function initActionRail(root) {
  const rails = root.querySelectorAll("[data-jestei-action-rail]");

  rails.forEach((rail) => {
    const viewport = rail.querySelector("[data-jestei-action-rail-viewport]");
    const prev = rail.querySelector("[data-jestei-action-rail-prev]");
    const next = rail.querySelector("[data-jestei-action-rail-next]");

    if (!(viewport instanceof HTMLElement)) return;

    const step = () => Math.max(240, Math.round(viewport.clientWidth * 0.8));
    const move = (direction) => viewport.scrollBy({ left: direction * step(), behavior: "smooth" });

    prev?.addEventListener("click", () => move(-1));
    next?.addEventListener("click", () => move(1));
  });
}

export function initJesteiActionRail(root = document) {
  initActionRail(root);
}
