import { styxProductionMockupDeck } from "../../data/content/styx.ts";
import { renderAnimatedCanvasGallery } from "../../templates/animated-canvas-gallery.ts";

const productionGallerySlide = styxProductionMockupDeck.slides.find(
  (slide) => slide.kind === "canvas-gallery",
);
if (!productionGallerySlide || productionGallerySlide.kind !== "canvas-gallery") {
  throw new Error("Styx production canvas gallery slide is missing.");
}
const productionGallery = productionGallerySlide.gallery;

const meta = {
  title: "03 Organisms/Animated Canvas Gallery",
  tags: ["autodocs"],
  render: () => renderAnimatedCanvasGallery(productionGallery),
  parameters: {
    layout: "padded",
  },
};

export default meta;
export const Loading = {};
export const Ready = {
  play: ({ canvasElement }) => {
    const gallery = canvasElement.querySelector("[data-animated-canvas-gallery]");
    if (gallery instanceof HTMLElement) gallery.dataset.galleryState = "ready";
  },
};
export const Error = {
  play: ({ canvasElement }) => {
    const gallery = canvasElement.querySelector("[data-animated-canvas-gallery]");
    if (gallery instanceof HTMLElement) gallery.dataset.galleryState = "error";
  },
};
