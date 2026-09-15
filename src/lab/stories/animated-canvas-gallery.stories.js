import { renderAnimatedCanvasGallery } from "../../templates/animated-canvas-gallery.ts";

const productionFixture = {
  profile: "production",
  variant: "masonry",
  ariaLabel: "Storybook production masonry gallery",
  sources: [
    { entryId: "styx-07-source-01-4x5-use-01" },
    { entryId: "styx-07-source-02-4x5-use-01" },
    { entryId: "styx-07-source-05-4x5-use-01" },
  ],
};

const meta = {
  title: "03 Organisms/Animated Canvas Gallery",
  tags: ["autodocs", "stable", "a11y-reviewed", "project:styx"],
  render: () => renderAnimatedCanvasGallery(productionFixture),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/templates/animated-canvas-gallery.ts",
        "src/components/animated-canvas-gallery.js",
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
