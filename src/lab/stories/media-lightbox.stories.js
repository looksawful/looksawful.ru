import { createMediaLightbox } from "../../components/media-lightbox.ts";
import { awfulCasesDemo } from "../../data/content/awful-cases.ts";
import { renderMediaFigure } from "../../templates/media-figure.ts";

const initialize = ({ canvasElement }) => createMediaLightbox({ root: canvasElement });

const meta = {
  title: "03 Organisms/Media Lightbox",
  tags: ["autodocs", "stable", "a11y-reviewed", "project:awful-cases"],
  render: () => renderMediaFigure(awfulCasesDemo, { reveal: false }),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/components/media-lightbox.ts",
        "src/components/photoswipe-lightbox.ts",
        "src/templates/media-figure.ts",
        "src/data/content/awful-cases.ts",
        "src/styles/captions.css",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "lightbox-closed",
      visibility: ["overlay"],
      interaction: ["closed", "focus-visible"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
  },
};

export default meta;
export const Closed = { play: initialize };
export const Open = {
  play: (context) => {
    initialize(context);
    const source = context.canvasElement.querySelector("[data-lightbox-source]");
    if (source instanceof HTMLElement) {
      source.focus();
      source.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    }
  },
  parameters: {
    looksawful: {
      state: "lightbox-open",
      interaction: ["open", "focus-visible"],
    },
  },
};
