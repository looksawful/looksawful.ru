import {
  renderBeforeAfter,
  renderJustifiedGallery,
  renderMediaFigure,
  renderMediaGroup,
  renderMediaSlider,
  renderMockup,
  renderMockupDeck,
  renderPageFlip,
} from "../../../components/content/index.ts";
import {
  renderAnimatedCanvasGallery,
  renderJesteiThemeOrganismMockup,
} from "../../../components/specialized/index.ts";
import {
  assertNeverContentBlock,
  type ContentBlock,
} from "../../../content/contracts/content-block.ts";

/**
 * Canonical renderer boundary for PageContent blocks.
 *
 * The discriminated union is deliberately closed: adding a new block family
 * requires both a contract change and an explicit renderer branch here.
 */
export function renderContentBlock(block: ContentBlock): string {
  switch (block.type) {
    case "media-figure":
      return renderMediaFigure(block.data);
    case "media-group":
      return renderMediaGroup(block.data);
    case "media-slider":
      return renderMediaSlider(block.data);
    case "mockup":
      return renderMockup(block.data);
    case "mockup-deck":
      return renderMockupDeck(block.data);
    case "justified-gallery":
      return renderJustifiedGallery(block.data);
    case "before-after":
      return renderBeforeAfter(block.data);
    case "page-flip":
      return renderPageFlip(block.data);
    case "animated-canvas-gallery":
      return renderAnimatedCanvasGallery(block.data);
    case "jestei-theme":
      return renderJesteiThemeOrganismMockup(block.data);
    default:
      return assertNeverContentBlock(block);
  }
}

export function renderContentBlocks(blocks: readonly ContentBlock[]): string {
  return blocks.map(renderContentBlock).join("\n");
}
