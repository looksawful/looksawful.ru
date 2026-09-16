import { expect } from "storybook/test";
import { createJesteiThemeOrganism } from "../../components/jestei-theme-organism/jestei-theme-organism.js";
import { jesteiThemeOrganismMockup } from "../../data/content/jestei-theme-organism.ts";
import { renderJesteiThemeOrganismMockup } from "../../templates/jestei-theme-organism.ts";

const sources = ["src/components/jestei-theme-organism/jestei-theme-organism.js", "src/templates/jestei-theme-organism.ts"];
const evidence = (state) => ({ looksawful: { sources, layer: "organism", policy: "isolated", canonical: true, state, visibility: ["breakpoint"], motion: ["motion-enabled", "reduced-motion"], responsive: { review: ["desktop", "tablet", "mobile"] } } });
const reducedMotion = { allowsMotion: () => false, subscribe: (listener, { immediate = true } = {}) => { if (immediate) listener({ allowed: false }); return () => {}; } };
const meta = { title: "03 Organisms/Jestei Theme Organism", render: () => renderJesteiThemeOrganismMockup(jesteiThemeOrganismMockup), parameters: evidence("static") };
export default meta;

export const Static = { play: async ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-jestei-theme-organism]");
  const api = createJesteiThemeOrganism({ root, motion: reducedMotion });
  expect(root).toHaveAttribute("data-motion-preference", "reduce");
  expect(root).toHaveAttribute("data-motion-state", "static");
  api?.destroy?.();
} };
