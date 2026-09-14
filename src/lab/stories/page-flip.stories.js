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
      sources: ["src/templates/page-flip.ts", "src/components/page-flip.ts", "src/data/content/sensetique.ts"],
      layer: "organism",
      policy: "isolated",
      canonical: true,
      state: "default",
      visibility: ["always"],
    },
  },
};

export default meta;
export const Default = {
  play: ({ canvasElement }) => {
    const root = canvasElement.querySelector("[data-page-flip]");
    if (root) createPageFlip(root, { motion: motionPreference });
  },
};
