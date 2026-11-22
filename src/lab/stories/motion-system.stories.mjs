import { renderSectionIntro } from "../../templates/section-intro.ts";
import { sensetiqueProductionIntro } from "../../data/content/sensetique.ts";
import { renderSubprojectCard } from "../../templates/subproject-card.ts";
import { petProjectCards } from "../../data/subproject-cards.ts";
import { initMotion } from "../../motion.ts";

const meta = {
  title: "07 Motion/Reveal System",
  tags: ["autodocs", "stable"],
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/motion-contract.ts", "src/motion.ts", "src/styles/motion.css",
        "src/templates/section-intro.ts", "src/templates/subproject-card.ts",
      ],
      layer: "motion",
      policy: "behavior-fixture",
      canonical: true,
      motion: ["motion-enabled", "reduced-motion"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: { description: { component: "Production GSAP one-shot reveals for copy, media and cards. Toggle the Storybook reduced-motion browser preference to inspect the no-animation contract." } },
  },
};
export default meta;

export const SectionReveal = {
  render: () => '<main class="wrapper" style="padding-block:var(--size-500)">' +
    renderSectionIntro(sensetiqueProductionIntro, { reveal: true }) + '</main>',
  play: ({ canvasElement }) => initMotion({ root: canvasElement }),
};

export const CardReveal = {
  render: () => '<main class="wrapper" style="--wrapper-max-width:32rem;padding-block:var(--size-500)">' +
    renderSubprojectCard(petProjectCards[0], { reveal: true }) + '</main>',
  play: ({ canvasElement }) => initMotion({ root: canvasElement }),
};

export const ReducedMotionReference = {
  render: () => '<main class="wrapper" style="padding-block:var(--size-500)">' +
    renderSectionIntro(sensetiqueProductionIntro, { reveal: false }) + '</main>',
  parameters: { looksawful: { state: "reduced-motion-static-reference", motion: ["reduced-motion"] } },
};
