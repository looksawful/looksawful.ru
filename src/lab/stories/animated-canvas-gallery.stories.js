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
  tags: ["autodocs", "stable", "a11y-reviewed", "project:styx"],
  render: () => renderAnimatedCanvasGallery(productionGallery),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/templates/animated-canvas-gallery.ts",
        "src/components/animated-canvas-gallery.js",
        "src/data/content/styx.ts",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "loading",
      visibility: ["conditional", "data", "offscreen-or-virtualized"],
      data: ["loading", "ready", "error"],
      motion: ["motion-enabled", "reduced-motion"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
  },
};

export default meta;
export const Loading = {};
export const Ready = {
  play: ({ canvasElement }) => {
    const gallery = canvasElement.querySelector("[data-animated-canvas-gallery]");
    if (gallery instanceof HTMLElement) gallery.dataset.galleryState = "ready";
  },
  parameters: { looksawful: { state: "ready", data: ["ready"] } },
};
export const Error = {
  play: ({ canvasElement }) => {
    const gallery = canvasElement.querySelector("[data-animated-canvas-gallery]");
    if (gallery instanceof HTMLElement) gallery.dataset.galleryState = "error";
  },
  parameters: { looksawful: { state: "error", data: ["error"] } },
};
