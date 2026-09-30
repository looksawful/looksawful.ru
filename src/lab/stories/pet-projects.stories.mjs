import { renderUsefulPreview } from "./useful-preview.mjs";
export default {
  title: "03 Organisms/Pet Projects", tags: ["autodocs", "stable"],
  render: () => renderUsefulPreview(),
  parameters: { layout: "fullscreen", looksawful: {
    sources: ["src/site/renderers/home/home-slots.ts", "src/templates/subproject-card.ts", "src/data/subproject-cards.ts"],
    layer: "organism", policy: "composition", canonical: true,
    state: "production-candidate", visibility: ["data"], interaction: ["default", "focus-visible"],
    motion: ["motion-enabled", "reduced-motion"], responsive: { review: ["desktop", "tablet", "mobile"] },
  } },
};
export const ProductionCandidate = {};
export const MobileReel = { globals: { viewport: { value: "mobile", isRotated: false } } };
export const IntermediateLayout = { globals: { viewport: { value: "tablet", isRotated: false } } };
export const WideLayout = { globals: { viewport: { value: "desktop", isRotated: false } } };
