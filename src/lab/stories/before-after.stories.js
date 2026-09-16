import { expect, fireEvent } from "storybook/test";
import { initBeforeAfter } from "../../components/before-after.ts";
import { jesteiSubscriptionBeforeAfter } from "../../data/content/jestei-pool.ts";
import { renderBeforeAfter } from "../../templates/before-after.ts";
const motionPreference = { allowsMotion: () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches };
const evidence = (state) => ({ looksawful: { sources: ["src/components/before-after.ts", "src/templates/before-after.ts"], layer: "organism", policy: "isolated", canonical: true, state, visibility: ["breakpoint"], motion: ["motion-enabled", "reduced-motion"], responsive: { review: ["desktop", "tablet", "mobile"] } } });
const meta = { title: "03 Organisms/Before After", tags: ["autodocs", "stable", "a11y-reviewed", "project:jestei"], render: () => renderBeforeAfter(jesteiSubscriptionBeforeAfter), parameters: evidence("manual") };
export default meta;
export const Default = { play: async ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-before-after]");
  initBeforeAfter(root, { motion: motionPreference, autoReveal: false });
  const range = root.querySelector('input[type="range"]');
  expect(range).toBeInTheDocument();
  await fireEvent.input(range, { target: { value: "70" } });
  expect(range).toHaveValue("70");
} };
export const AutoReveal = { parameters: evidence("auto-reveal"), play: async ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-before-after]");
  initBeforeAfter(root, { motion: motionPreference, autoReveal: true });
  expect(root.querySelector('input[type="range"]')).toBeInTheDocument();
} };
