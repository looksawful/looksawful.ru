import { styxProductionMockupDeck } from "../../data/content/styx.ts";
import { renderAnimatedCanvasGallery } from "../../templates/animated-canvas-gallery.ts";
import { renderJesteiThemeOrganismMockup } from "../../templates/jestei-theme-organism.ts";
import { jesteiThemeOrganismMockup } from "../../data/content/jestei-theme-organism.ts";

const canvasSlide = styxProductionMockupDeck.slides.find((slide) => slide.kind === "canvas-gallery");
if (!canvasSlide || canvasSlide.kind !== "canvas-gallery") throw new Error("Canonical canvas gallery is unavailable");

const meta = {
  title: "08 Feedback/Loading & Error States",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: { description: { component: "Real project loading and error markup, not decorative fake placeholders. Standalone Skeleton and Preloader families have no canonical production implementations yet." } },
  },
};
export default meta;

function canvasState(state) {
  return '<main class="wrapper" style="padding-block:var(--size-500)"><h2>Canvas gallery · ' +
    state + '</h2>' + renderAnimatedCanvasGallery(canvasSlide.gallery).replace('data-gallery-state="loading"', 'data-gallery-state="' + state + '"') +
    '</main>';
}

export const CanvasLoading = { render: () => canvasState("loading") };
export const CanvasError = { render: () => canvasState("error") };
export const CanvasReady = { render: () => canvasState("ready") };
export const ThemePreloader = {
  render: () => renderJesteiThemeOrganismMockup(jesteiThemeOrganismMockup)
    .replaceAll('data-motion-state="static"', 'data-motion-state="loading"')
    .replace('aria-busy="false"', 'aria-busy="true"'),
  parameters: { docs: { description: { story: "The existing Jestei theme organism in its authored loading state, including the real loading surface and aria-live status." } } },
};

export const UnimplementedFamilies = {
  render: () => '<main class="wrapper stack" style="--stack-space:var(--size-300);padding-block:var(--size-600)">' +
    '<h1>Unimplemented · not production UI</h1>' +
    '<p>Standalone Skeleton: no canonical component in site source.</p>' +
    '<p>Global visual Preloader: no canonical component in site source. The Jestei theme organism has its own component-local loader above.</p>' +
    '<p>These are inventory gaps, not examples. Create production components only after design approval.</p></main>',
  parameters: { looksawful: { canonical: false, policy: "experimental" } },
};
