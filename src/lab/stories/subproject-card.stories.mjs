import { petProjectCards } from "../../data/subproject-cards.ts";
import { renderUsefulPreview, initializeUseful } from "./useful-preview.mjs";

const live = petProjectCards.find((card) => card.state === "live" && card.href);
const comingSoon = petProjectCards.find((card) => card.state === "coming-soon" && !card.href);
let cleanup = () => {};
const storyFor = (card) => ({
  render: () => {
    if (!card) throw new Error("Requested canonical Useful state is unavailable");
    return renderUsefulPreview(card.id);
  },
  play: (context) => { cleanup(); cleanup = initializeUseful(context); },
});
export default {
  title: "02 Molecules/Subproject Card", tags: ["autodocs", "stable"],
  beforeEach: () => { cleanup(); return () => cleanup(); },
  parameters: { layout: "fullscreen", looksawful: {
    sources: ["src/data/subproject-cards.ts", "src/templates/subproject-card.ts", "src/site/renderers/home/home-slots.ts"],
    layer: "molecule", policy: "behavior-fixture", canonical: true,
    state: "authored-card-states", visibility: ["data"], interaction: ["default", "focus-visible"],
    responsive: { review: ["desktop", "tablet", "mobile"] },
  } },
};
export const Live = storyFor(live);
export const ComingSoon = storyFor(comingSoon);
