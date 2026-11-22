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
  tags: ["autodocs"],
  render: () => renderMediaSlider(sensetiqueHarshLightSlider),
  parameters: {
    layout: "padded",
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
  parameters: { looksawful: { state: "next-selected", interaction: ["selected", "active-or-pressed"] } },
};
export const ReducedMotion = {
  play: (context) => initialize(context, reducedMotion),
  parameters: { looksawful: { state: "reduced-motion", motion: ["reduced-motion"] } },
};
