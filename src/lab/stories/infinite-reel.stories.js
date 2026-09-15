import { createInfiniteReel } from "../../components/infinite-reel.ts";
import { jesteiInstagramPlayerStrip } from "../../data/content/jestei-pool.ts";
import { renderMediaGroup } from "../../templates/media-group.ts";

const motionPreference = {
  allowsMotion: () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  subscribe: () => () => {},
};

const meta = {
  title: "03 Organisms/Infinite Reel",
  tags: ["autodocs", "stable", "project:jestei"],
  render: () => renderMediaGroup(jesteiInstagramPlayerStrip),
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/components/infinite-reel.ts",
        "src/data/content/jestei-pool.ts",
        "src/templates/media-group.ts",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "runtime-ready",
      visibility: ["always"],
      motion: ["motion-enabled", "reduced-motion"],
      responsive: {
        review: ["desktop", "tablet", "mobile"],
      },
    },
    docs: {
      description: {
        component: "Uses the production Jestei Instagram strip data, production media-group renderer and Infinite Reel runtime. Clone lifecycle, viewport gating, responsive width gating, media playback and reduced-motion behavior remain production-owned.",
      },
    },
  },
};

export default meta;

export const RuntimeReady = {
  play: ({ canvasElement }) => {
    const root = canvasElement.querySelector("[data-infinite-reel]");
    if (root) createInfiniteReel(root, { motion: motionPreference });
  },
};
