export function initCvScrollRows(root = document) {
  root.querySelectorAll("[data-scroll-row]").forEach((row) => {
    if (row.dataset.cvScrollMounted === "true") {
      return;
    }

    const track = row.querySelector("[data-scroll-track]");
    const prev = row.querySelector("[data-scroll-prev]");
    const next = row.querySelector("[data-scroll-next]");

    if (!track) {
      return;
    }

    row.dataset.cvScrollMounted = "true";

    const scrollByPage = (direction) => {
      track.scrollBy({
        left: direction * Math.max(240, track.clientWidth * 0.82),
        behavior: "smooth",
      });
    };

    prev?.addEventListener("click", () => scrollByPage(-1));
    next?.addEventListener("click", () => scrollByPage(1));

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    track.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }

      isDragging = true;
      startX = event.clientX;
      startScrollLeft = track.scrollLeft;
      track.classList.add("is-dragging");
      track.setPointerCapture?.(event.pointerId);
    });

    track.addEventListener("pointermove", (event) => {
      if (!isDragging) {
        return;
      }

      event.preventDefault();
      track.scrollLeft = startScrollLeft - (event.clientX - startX);
    });

    const stopDragging = (event) => {
      if (!isDragging) {
        return;
      }

      isDragging = false;
      track.classList.remove("is-dragging");
      track.releasePointerCapture?.(event.pointerId);
    };

    track.addEventListener("pointerup", stopDragging);
    track.addEventListener("pointercancel", stopDragging);
    track.addEventListener("pointerleave", stopDragging);
  });
}
