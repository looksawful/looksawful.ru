import { createPageFlip } from "../../components/page-flip.ts";
import { sensetiqueDigitalFearPageFlip } from "../../data/content/sensetique.ts";
import { renderPageFlip } from "../../templates/page-flip.ts";

const motionPreference = {
  allowsMotion: () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const meta = {
  title: "03 Organisms/Page Flip",
  tags: ["autodocs", "stable", "project:sensetique"],
  render: () => renderPageFlip(sensetiqueDigitalFearPageFlip),
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/components/page-flip.ts",
        "src/data/content/sensetique.ts",
        "src/templates/page-flip.ts",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "interactive-ready",
      visibility: ["always"],
      motion: ["motion-enabled", "reduced-motion"],
      responsive: {
        review: ["desktop", "tablet", "mobile"],
      },
    },
    docs: {
      description: {
        component: "Uses the canonical Sensetique page-flip data, production renderer and production runtime enhancer. Motion behavior follows the current prefers-reduced-motion environment.",
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
