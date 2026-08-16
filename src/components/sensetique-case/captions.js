const TOUCH_QUERY = "(hover: none), (pointer: coarse)";

export function createSensetiqueCaptions(scene, signal) {
  const touch = window.matchMedia?.(TOUCH_QUERY);

  const closeOpenCaption = (except = null) => {
    scene.querySelectorAll('figure[data-caption-open="true"]').forEach((figure) => {
      if (figure !== except) figure.removeAttribute("data-caption-open");
    });
  };

  scene.addEventListener(
    "click",
    (event) => {
      if (!touch?.matches) return;

      const surface = event.target.closest?.("[data-media-caption-surface]");
      if (!(surface instanceof HTMLElement) || !scene.contains(surface)) {
        closeOpenCaption();
        return;
      }

      const figure = surface.closest("figure[data-sensetique-hover-caption]");
      if (!(figure instanceof HTMLElement)) {
        closeOpenCaption();
        return;
      }

      const willOpen = figure.dataset.captionOpen !== "true";
      closeOpenCaption(figure);
      if (willOpen) figure.dataset.captionOpen = "true";
      else figure.removeAttribute("data-caption-open");
    },
    { signal },
  );

  scene.addEventListener(
    "keydown",
    (event) => {
      const surface = event.target.closest?.("[data-media-caption-surface]");
      if (!(surface instanceof HTMLElement) || !scene.contains(surface)) return;

      const figure = surface.closest("figure[data-sensetique-hover-caption]");
      if (!(figure instanceof HTMLElement)) return;

      if (event.key === "Escape") {
        figure.removeAttribute("data-caption-open");
        surface.blur();
        return;
      }

      if (touch?.matches && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        const willOpen = figure.dataset.captionOpen !== "true";
        closeOpenCaption(figure);
        if (willOpen) figure.dataset.captionOpen = "true";
        else figure.removeAttribute("data-caption-open");
      }
    },
    { signal },
  );

  return () => closeOpenCaption();
}
