import { createMediaDeck } from "../../components/media-deck.ts";
import { sensetiqueHarshLightSlider } from "../../data/content/sensetique.ts";
import { renderMediaSlider } from "../../templates/media-slider.ts";

const motionPreference = {
  allowsMotion: () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const mount = ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-media-deck]");
  if (root) createMediaDeck(root, { motion: motionPreference });
};

const meta = {
  title: "03 Organisms/Media Deck",
  tags: ["autodocs", "stable", "project:sensetique"],
  render: () => renderMediaSlider(sensetiqueHarshLightSlider),
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/components/media-deck.ts",
        "src/components/embla-deck.ts",
        "src/data/content/sensetique.ts",
        "src/templates/media-slider.ts",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "selected-slide",
      visibility: ["offscreen-or-virtualized"],
      interaction: ["default", "selected"],
      motion: ["motion-enabled", "reduced-motion"],
      responsive: {
        review: ["desktop", "tablet", "mobile"],
      },
    },
    docs: {
      description: {
        component: "Uses the canonical Sensetique HARSH LIGHT slider data, production media-slider renderer and production Media Deck runtime. Navigation, selected slide state, viewport-gated autoplay and motion behavior remain owned by production code.",
      },
    },
  },
};

export default meta;

export const InteractiveReady = {
  play: mount,
};

export const NextSelected = {
  play: (context) => {
    mount(context);
    const next = context.canvasElement.querySelector("[data-deck-next]");
    if (next instanceof HTMLButtonElement) next.click();
  },
  parameters: {
    looksawful: {
      state: "next-slide-selected",
      interaction: ["selected"],
    },
  },
};
