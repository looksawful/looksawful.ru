import type { MediaEntryId } from "../../data/media/index.ts";
import type {
  MovesAnimatedCanvasGalleryData,
  MovesCanvasGalleryVariant,
} from "../../types/animated-canvas-gallery.ts";
import { renderAnimatedCanvasGallery } from "./animated-canvas-gallery.ts";

const MOVES_CANVAS_TABS = [
  ["arc", "arc"],
  ["spiral", "spiral"],
  ["horizontal", "horizontal"],
  ["diagonal", "diagonal"],
  ["showcase-diagonal", "showcase diagonal"],
  ["masonry", "masonry"],
] as const satisfies readonly (readonly [MovesCanvasGalleryVariant, string])[];

function renderVariantTabs(): string {
  return MOVES_CANVAS_TABS.map(
    ([variant, label], index) =>
      `<button aria-selected="${index === 0 ? "true" : "false"}" class="variant-tab" data-canvas-gallery-tab="" data-variant="${variant}" role="tab" type="button">${label}</button>`,
  ).join("\n");
}

export function renderMovesCanvasDemo(
  data: MovesAnimatedCanvasGalleryData<MediaEntryId>,
): string {
  return `
    <figure class="moves-awful-interactive real-gallery-frame">
      <div class="browser-mockup">
        <div aria-hidden="true" class="browser-mockup__bar">
          <div class="browser-mockup__controls cluster">
            <span class="browser-mockup__dot browser-mockup__dot--red"></span>
            <span class="browser-mockup__dot browser-mockup__dot--yellow"></span>
            <span class="browser-mockup__dot browser-mockup__dot--green"></span>
          </div>
          <div class="browser-mockup__address"></div>
          <div class="browser-mockup__menu">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div class="browser-mockup__screen">
          <div class="moves-awful-stage">
            <div class="moves-awful-stage__scale">
              <div class="gallery-title-pile pile" data-gallery-title-pile="">
                <h3 class="gallery-title-pile__title" data-canvas-gallery-title="" id="gallery-overlay-title">Arc</h3>
              </div>
              ${renderAnimatedCanvasGallery(data)}
            </div>
          </div>
        </div>
        <div class="browser-mockup__controls-area">
          <div aria-label="Варианты Moves Awful" class="variant-tabs reel" data-canvas-gallery-tabs="" data-moves-awful-tabs="" role="tablist">
            ${renderVariantTabs()}
          </div>
        </div>
      </div>
    </figure>
  `;
}
