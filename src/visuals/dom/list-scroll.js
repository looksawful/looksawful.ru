function initListScroll(root = document) {
  const elements = root.querySelectorAll(".list-scroll-x");

  elements.forEach((element) => {
    if (!(element instanceof HTMLElement)) {
      return;
    }

    let isDown = false;
    let wasDragged = false;
    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let pointerId = null;

    const isScrollable = () => element.scrollWidth > element.clientWidth + 2;

    element.setAttribute("tabindex", "0");

    element.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0 || !isScrollable()) {
        return;
      }

      isDown = true;
      wasDragged = false;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startScrollLeft = element.scrollLeft;

      element.classList.add("is-dragging");
      element.setPointerCapture(pointerId);
    });

    element.addEventListener("pointermove", (event) => {
      if (!isDown || event.pointerId !== pointerId) {
        return;
      }

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!wasDragged && absX > 4 && absX > absY) {
        wasDragged = true;
      }

      if (!wasDragged) {
        return;
      }

      event.preventDefault();
      element.scrollLeft = startScrollLeft - deltaX;
    });

    const stopDrag = (event) => {
      if (!isDown || event.pointerId !== pointerId) {
        return;
      }

      isDown = false;
      pointerId = null;
      element.classList.remove("is-dragging");

      window.setTimeout(() => {
        wasDragged = false;
      }, 0);
    };

    element.addEventListener("pointerup", stopDrag);
    element.addEventListener("pointercancel", stopDrag);

    element.addEventListener("lostpointercapture", () => {
      isDown = false;
      pointerId = null;
      element.classList.remove("is-dragging");
    });

    element.addEventListener(
      "click",
      (event) => {
        if (!wasDragged) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
      },
      true,
    );

    element.addEventListener("keydown", (event) => {
      if (!isScrollable()) {
        return;
      }

      const step = Math.max(180, element.clientWidth * 0.72);

      if (event.key === "ArrowRight") {
        event.preventDefault();
        element.scrollBy({ left: step, behavior: "smooth" });
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        element.scrollBy({ left: -step, behavior: "smooth" });
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initListScroll(), { once: true });
} else {
  initListScroll();
}

export { initListScroll };
