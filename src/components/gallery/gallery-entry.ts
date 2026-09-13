import { createGalleryController } from "./gallery-controller.ts";

const root = document.querySelector<HTMLElement>("[data-gallery]");
const destroy = root ? createGalleryController(root) : null;

if (destroy) {
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) destroy();
  }, { once: true });
}
