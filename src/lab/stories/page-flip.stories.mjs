import { createPageFlip } from "../../components/page-flip.ts";
import { sensetiqueDigitalFearPageFlip } from "../../data/content/sensetique.ts";
import { renderPageFlip } from "../../templates/page-flip.ts";

const motionPreference = {
  allowsMotion: () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const meta = {
  title: "03 Organisms/Page Flip",
  tags: ["autodocs"],
  render: () => renderPageFlip(sensetiqueDigitalFearPageFlip),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Uses the canonical Sensetique page-flip data, production renderer and production runtime enhancer. Runtime evidence includes disabled edge controls, active paging, portrait/landscape orientation and prefers-reduced-motion behavior.",
      },
    },
  },
};

export default meta;

export const InteractiveReady = {
  play: ({ canvasElement }) => {
    const root = canvasElement.querySelector("[data-page-flip]");
    if (root) createPageFlip(root, { motion: motionPreference });
  },
};
