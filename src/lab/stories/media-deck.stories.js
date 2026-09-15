import { createMediaDeck } from "../../components/media-deck.ts";
import { sensetiqueHarshLightSlider } from "../../data/content/sensetique.ts";
import { renderMediaSlider } from "../../templates/media-slider.ts";

const motionEnabled = { allowsMotion: () => true, subscribe: () => () => {} };
const reducedMotion = { allowsMotion: () => false, subscribe: () => () => {} };

const initialize = ({ canvasElement }, motion = motionEnabled) => {
  const deck = canvasElement.querySelector("[data-media-deck]");
  if (deck instanceof HTMLElement) return createMediaDeck(deck, { motion });
  return () => {};
};

const meta = {
  title: "03 Organisms/Media Deck",
  tags: ["autodocs", "stable", "a11y-reviewed", "project:sensetique"],
  render: () => renderMediaSlider(sensetiqueHarshLightSlider),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/components/media-deck.ts",
        "src/templates/media-slider.ts",
        "src/data/content/sensetique.ts",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "selected-slide",
      visibility: ["offscreen-or-virtualized"],
      interaction: ["default", "selected"],
      motion: ["motion-enabled", "reduced-motion"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
  },
};

export default meta;
export const Selected = { play: (context) => initialize(context) };
export const NextSelected = {
  play: (context) => {
    initialize(context);
    const next = context.canvasElement.querySelector("[data-deck-next]");
    if (next instanceof HTMLButtonElement) next.click();
  },
  parameters: { looksawful: { state: "next-selected", interaction: ["default", "selected"] } },
};
export const ReducedMotion = {
  play: (context) => initialize(context, reducedMotion),
  parameters: { looksawful: { state: "reduced-motion", motion: ["reduced-motion"] } },
};

