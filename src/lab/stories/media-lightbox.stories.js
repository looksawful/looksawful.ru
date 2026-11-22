import { createMediaLightbox } from "../../components/media-lightbox.ts";
import { awfulCasesDemo } from "../../data/content/awful-cases.ts";
import { renderMediaFigure } from "../../templates/media-figure.ts";

const initialize = ({ canvasElement }) => createMediaLightbox({ root: canvasElement });

const meta = {
  title: "03 Organisms/Media Lightbox",
  tags: ["autodocs"],
  render: () => renderMediaFigure(awfulCasesDemo, { reveal: false }),
  parameters: {
    layout: "padded",
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
  },
};
