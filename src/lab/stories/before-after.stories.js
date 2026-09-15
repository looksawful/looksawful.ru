import { initBeforeAfter } from "../../components/before-after.ts";
import { jesteiSubscriptionBeforeAfter } from "../../data/content/jestei-pool.ts";
import { renderBeforeAfter } from "../../templates/before-after.ts";

const motionPreference = {
  allowsMotion: () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

const initialize = ({ canvasElement }, autoReveal = false) => {
  const root = canvasElement.querySelector("[data-before-after]");
  if (root) initBeforeAfter(root, { motion: motionPreference, autoReveal });
};

const meta = {
  title: "02 Molecules/Before After",
  tags: ["autodocs", "stable", "a11y-reviewed", "project:jestei"],
  render: () => renderBeforeAfter(jesteiSubscriptionBeforeAfter),
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/components/before-after.ts",
        "src/templates/before-after.ts",
      ],
      layer: "molecule",
      policy: "behavior-fixture",
      canonical: true,
      state: "comparison-ready",
      visibility: ["always"],
      interaction: ["default", "active-or-pressed"],
      motion: ["motion-enabled", "reduced-motion"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: {
      description: {
        component: "Uses canonical Jestei data, the production before-after renderer and runtime. Manual and auto-reveal are real runtime states; reduced motion follows the browser preference.",
      },
    },
  },
};

export default meta;

export const Default = {
  play: (context) => initialize(context, false),
};

export const ManualAdjusted = {
  play: (context) => {
    initialize(context, false);
    const range = context.canvasElement.querySelector(".before-after__range");
    if (range instanceof HTMLInputElement) {
      range.value = "72";
      range.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  parameters: {
    looksawful: {
      state: "manual-adjusted",
      interaction: ["active-or-pressed"],
    },
  },
};
export const AutoReveal = {
  play: (context) => initialize(context, true),
  parameters: {
    looksawful: {
      state: "auto-reveal",
      motion: ["motion-enabled", "reduced-motion"],
    },
  },
};
