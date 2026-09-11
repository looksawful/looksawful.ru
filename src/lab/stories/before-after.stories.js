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
    docs: {
      description: {
        component: "Uses the canonical Jestei data, src/templates/before-after.ts renderer and src/components/before-after.ts runtime.",
      },
    },
  },
};

export default meta;

export const Default = {
  play: (context) => initialize(context, false),
};

export const AutoReveal = {
  play: (context) => initialize(context, true),
};
